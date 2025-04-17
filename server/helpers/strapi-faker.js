"use strict";

const { faker } = require("@faker-js/faker");
const axios = require("axios");

module.exports = {
    async fakeAttr(
        attrName,
        attr,
        resultSoFar = {},
        modelAttrs = {},
        modelName
    ) {
        if (attrName in resultSoFar) {
            return resultSoFar[attrName];
        }
        const anl = attrName.toLowerCase();

        if (
            attrName === "createdAt" ||
            attrName === "updatedAt" ||
            attrName === "publishedAt" ||
            attrName === "deletedAt" ||
            attrName === "createdBy" ||
            attrName === "updatedBy" ||
            attrName === "publishedBy" ||
            attrName === "deletedBy" ||
            attrName === "createdById" ||
            attrName === "provider" ||
            attrName === "resetPasswordToken" ||
            attrName === "confirmationToken" ||
            attr.type === "relation"
        ) {
            return null;
        }

        if (attrName === "role") {
            return 1;
        }

        const iaResult = await generateFakeValueByIA(
            attrName,
            attr.type,
            modelName
        );

        if (iaResult) {
            return clearStrings(iaResult) || null;
        }

        switch (attr.type) {
            case "string":
                switch (anl) {
                    case "username":
                        return faker.internet.username();
                    case "firstname":
                        return faker.person.firstName();
                    case "lastname":
                        return faker.person.lastName();
                    case "position":
                        return faker.person.jobTitle();

                    default:
                        if (anl.includes("slug")) {
                            const base =
                                resultSoFar["name"] ||
                                resultSoFar["title"] ||
                                faker.lorem.words(
                                    faker.number.int({ min: 2, max: 4 })
                                );

                            return faker.helpers.slugify(base);
                        }
                        if (anl.includes("phone")) return faker.phone.number();
                        if (anl.includes("image") || anl.includes("photo"))
                            return faker.image.url();
                        if (anl.includes("city")) return faker.location.city();
                        if (anl.includes("address"))
                            return faker.location.streetAddress();
                        if (anl.includes("token"))
                            return faker.internet.password();
                        if (anl.includes("type")) return faker.lorem.word();
                        if (
                            [
                                "website",
                                "linkedin",
                                "github",
                                "homepage",
                                "youtube",
                            ].some((k) => anl.includes(k))
                        )
                            return faker.internet.url();
                        if (anl.includes("description"))
                            return faker.lorem.words(
                                faker.number.int({ min: 4, max: 6 })
                            );

                        break;
                }
                return faker.lorem.words(faker.number.int({ min: 2, max: 4 }));

            case "integer":
                return faker.number.int({ min: 0, max: 99 });

            case "biginteger":
                return faker.number.int({ min: 0, max: 9999999999 });

            case "float":
            case "decimal":
                return parseFloat(faker.commerce.price());

            case "date":
                return faker.date.recent().toISOString().split("T")[0];

            case "datetime":
                return faker.date.recent().toISOString();

            case "time":
                const hours = String(
                    faker.number.int({ min: 0, max: 23 })
                ).padStart(2, "0");
                const minutes = String(
                    faker.number.int({ min: 0, max: 59 })
                ).padStart(2, "0");
                const seconds = "00";

                return `${hours}:${minutes}:${seconds}`;

            case "array":
                return [faker.location.latitude(), faker.location.longitude()];

            case "email":
                return faker.internet.email({
                    firstName:
                        resultSoFar["username"] || faker.person.firstName(),
                });

            case "text":
                return faker.lorem.paragraph();

            case "password":
                return faker.internet.password();

            case "boolean":
                return faker.datatype.boolean();

            case "json":
                return {};

            case "enumeration":
                return faker.helpers.arrayElement(attr.enum);

            case "relation" && anl === "role":
                return 1;

            case "component":
                if (anl.includes("address") || anl.includes("endereco")) {
                    return {
                        street: faker.location.street(),
                        number: faker.number.int({ min: 1, max: 9999 }),
                        city: faker.location.city(),
                        state: faker.location.state(),
                        uf: faker.helpers.arrayElement([
                            "AC",
                            "AL",
                            "AM",
                            "AP",
                            "BA",
                            "CE",
                            "DF",
                            "ES",
                            "GO",
                            "MA",
                            "MG",
                            "MS",
                            "MT",
                            "PA",
                            "PB",
                            "PE",
                            "PI",
                            "PR",
                            "RJ",
                            "RN",
                            "RO",
                            "RR",
                            "RS",
                            "SC",
                            "SE",
                            "SP",
                            "TO",
                        ]),
                        neighborhood: faker.location.street(),
                        complement: faker.lorem.words(2),
                        zipcode: faker.location.zipCode(),
                    };
                }
                return {};
        }

        return null;
    },

    async fakeModel(modelName, model) {
        const result = {};
        for (const [attrName, attr] of Object.entries(model.attributes)) {
            const fakedAttributeVal = await module.exports.fakeAttr(
                attrName,
                attr,
                result,
                model.attributes,
                modelName
            );
            if (fakedAttributeVal !== null && fakedAttributeVal !== undefined) {
                result[attrName] = fakedAttributeVal;
            }
        }
        return result;
    },
};

const generateFakeValueByIA = async (attrName, attrType, modelName) => {
    const prompt = `Quero gerar um valor de exemplo para um campo de nome ${attrName} e tipo ${attrType} que faz parte do model ${modelName}. Responda com apenas o valor direto, sem explicações. Se for string não coloque aspas.`;

    try {
        const response = await axios.post(
            "http://localhost:11434/api/generate",
            {
                model: "llama3.2",
                prompt: prompt,
                stream: false,
                temperature: 0.0,
                top_p: 1.0,
                top_k: 1,
                presence_penalty: 0,
                frequency_penalty: 0,
                repeat_penalty: 1.0,
                stop: ["\n", "User:"],
                seed: 42,
                num_predict: 5,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.SEED_AI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data.response.trim().replace(/^["']|["']$/g, "");
    } catch (err) {
        console.error("Erro na IA:", err?.response?.data || err.message);
        return null;
    }
};

const clearStrings = (str) => {
    if (typeof str !== "string") return str;
    return str
        .replace(/\\n/g, "")
        .replace(/\\t/g, "")
        .replace(/\\r/g, "")
        .replace(/\s+/g, " ")
        .trim();
};
