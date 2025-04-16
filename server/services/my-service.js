"use strict";

const fs = require("fs");
const { fakeModel } = require("../helpers/strapi-faker");

const SEED_NUM_DEFAULT_ITEMS_DEFAULT = 2;
const SEED_OUTPUT_FOLDER_DEFAULT = ".tmp";

const seedDefaultIds = {};
let seedAllIds = {};

const seedModel = async (modelName, model, plugin = null) => {
    const entityIds = [];
    const numSeed = process.env.SEED_NUM_ITEMS || 5;
    const defaultPass = process.env.SEED_DEFAULT_USER_PASSWORD || "password";
    for (let i = 0; i < numSeed; i++) {
        const seedData = fakeModel(modelName, model);
        if (modelName === "user") {
            seedData.role = 1;
            seedData.confirmed = true;
            seedData.blocked = false;
            seedData.password = defaultPass;
        }
        try {
            const entity = await strapi
                .query(model.uid)
                .create({ data: seedData });
            entityIds.push(entity.id);
        } catch (e) {
            strapi.log.error(`Error inserting record; skipping: ${e}`);
        }
    }
    return entityIds;
};

const seedApiModelsWithoutRelations = async () => {
    let numSeeded = 0;
    const modelNamesToSeed = Object.keys(strapi.contentTypes).filter((uid) => {
        if (
            uid === "api::devicetoken.devicetoken" ||
            uid === "api::notification.notification"
        )
            return false;
        return uid.startsWith("api::");
    });

    const numDefault =
        process.env.SEED_NUM_DEFAULT_ITEMS || SEED_NUM_DEFAULT_ITEMS_DEFAULT;

    for (const modelName of modelNamesToSeed) {
        const model = strapi.getModel(modelName);
        if (!model) continue;

        strapi.log.debug(
            `[${numSeeded + 1}/${
                modelNamesToSeed.length
            }] Seeding w/o relations: ${modelName}`
        );

        const allIds = await seedModel(modelName, model);
        seedAllIds[modelName] = allIds;
        seedDefaultIds[modelName] = allIds.slice(0, numDefault);
        numSeeded++;
    }
};

const getDefaultModelRelations = (modelName, model) => {
    const result = {};
    for (const [attrName, attr] of Object.entries(model.attributes)) {
        if (["created_by", "updated_by"].includes(attrName)) {
            continue;
        }
        const relationModelName = attr.target;
        if (
            !relationModelName ||
            ["role", "file"].includes(relationModelName)
        ) {
            continue;
        }
        if (!(relationModelName in seedAllIds)) {
            strapi.log.warn(
                `No default ids for relation model ${relationModelName}, attribute ${attrName} on model ${modelName}`
            );
            continue;
        }
        if ("target" in attr) {
            const relationIds = seedAllIds[attr.target];
            result[attrName] =
                attr.relation === "oneToOne" ? relationIds[0] : relationIds;
        }
    }
    return result;
};

const seedModelRelations = async (modelName, model, plugin = null) => {
    const modelRelations = getDefaultModelRelations(modelName, model);

    const ids = {
        ...seedAllIds,
    };

    for (const fakeModelId of ids[modelName]) {
        const existingEntry = await strapi
            .query(model.uid)
            .findOne({ id: fakeModelId });
        for (const [propertyName, value] of Object.entries(modelRelations)) {
            if (Array.isArray(value)) {
                if (existingEntry[propertyName].length > 0) {
                    if (existingEntry[propertyName].length === value.length) {
                        delete modelRelations[propertyName];
                    } else if (
                        existingEntry[propertyName].length < value.length
                    ) {
                        const existingIds = existingEntry[propertyName].map(
                            (e) => e.id
                        );
                        const newIdsToAdd = value.filter(
                            (v) => !existingIds.includes(v)
                        );
                        modelRelations[propertyName] = existingIds
                            .concat(newIdsToAdd)
                            .slice(0, value.length);
                    }
                }
            } else {
                if (existingEntry[propertyName]) {
                    delete modelRelations[propertyName];
                }
            }
        }
        await strapi.query(model.uid).update({
            where: { id: fakeModelId },
            data: modelRelations,
        });
    }
};

const seedApiModelsRelations = async () => {
    let numSeeded = 0;

    const modelNamesToSeed = Object.keys(strapi.contentTypes).filter((uid) => {
        if (
            uid === "api::devicetoken.devicetoken" ||
            uid === "api::notification.notification"
        )
            return false;
        return uid.startsWith("api::");
    });

    for (const modelName of modelNamesToSeed) {
        const model = strapi.getModel(modelName);
        strapi.log.debug(
            `[${numSeeded + 1}/${
                modelNamesToSeed.length
            }] Seeding relations: ${modelName}`
        );
        await seedModelRelations(modelName, model);
        numSeeded++;
    }
};

const persistSeedOutput = async () => {
    const seedOutputFolder =
        process.env.SEED_OUTPUT_FOLDER || SEED_OUTPUT_FOLDER_DEFAULT;
    if (!fs.existsSync(seedOutputFolder)) {
        strapi.log.debug(`Creating folder ${seedOutputFolder}`);
        fs.mkdirSync(seedOutputFolder);
    }

    fs.writeFileSync(
        `${seedOutputFolder}/seed_output_default.json`,
        JSON.stringify(seedDefaultIds)
    );
    fs.writeFileSync(
        `${seedOutputFolder}/seed_output_full.json`,
        JSON.stringify(seedAllIds)
    );
    strapi.log.info(
        `Persisted seed output to ${seedOutputFolder}/seed_output_default.json & ${seedOutputFolder}/seed_output_full.json`
    );
};

const readSeedOutput = () => {
    const seedOutputFolder =
        process.env.SEED_OUTPUT_FOLDER || SEED_OUTPUT_FOLDER_DEFAULT;
    if (!fs.existsSync(`${seedOutputFolder}/seed_output_full.json`)) {
        strapi.log.error(
            "No previous seed output found. Run `up` before running `down`"
        );
        return null;
    }
    return JSON.parse(
        fs.readFileSync(`${seedOutputFolder}/seed_output_full.json`)
    );
};

module.exports = {
    async up() {
        strapi.log.debug("Seeding w/o relations: user");
        const userModel = strapi.getModel("plugin::users-permissions.user");
        const allUserIds = await seedModel(
            "user",
            userModel,
            "users-permissions"
        );
        strapi.log.debug("Seeding relations: user");
        seedAllIds["user"] = allUserIds;
        const numDefault =
            process.env.SEED_NUM_DEFAULT_ITEMS ||
            SEED_NUM_DEFAULT_ITEMS_DEFAULT;
        seedDefaultIds["user"] = allUserIds.slice(0, numDefault);
        await seedApiModelsWithoutRelations();
        await seedModelRelations("user", userModel, "users-permissions");
        await seedApiModelsRelations();
        await persistSeedOutput();
    },

    async down() {
        seedAllIds = readSeedOutput();
        if (!seedAllIds) {
            return;
        }
        const numModels = Object.keys(seedAllIds).length;
        let numDeleted = 0;
        strapi.log.debug("Removing seeded ids from all models");
        for (const key of Object.keys(seedAllIds)) {
            const ids = seedAllIds[key];

            strapi.log.debug(
                `[${
                    numDeleted + 1
                }/${numModels}] Removing fake entries for ${key}`
            );
            for (const id of ids) {
                if (key === "user") {
                    await strapi
                        .query("plugin::users-permissions.user")
                        .delete({
                            where: {
                                id,
                            },
                        });
                } else {
                    await strapi.query(key).delete({ where: { id } });
                }
            }
            numDeleted++;
        }

        const seedOutputFolder =
            process.env.SEED_OUTPUT_FOLDER || SEED_OUTPUT_FOLDER_DEFAULT;
        strapi.log.debug(
            `Removing seed outputs ${seedOutputFolder}/seed_output_default.json & ${seedOutputFolder}/seed_output_full.json`
        );
        fs.unlinkSync(`${seedOutputFolder}/seed_output_default.json`);
        fs.unlinkSync(`${seedOutputFolder}/seed_output_full.json`);
    },
};
