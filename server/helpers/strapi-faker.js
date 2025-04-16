"use strict";

const { faker } = require("@faker-js/faker");
const axios = require("axios");

module.exports = {
    fakeAttr(attrName, attr, resultSoFar = {}, modelAttrs = {}) {
        if (attrName in resultSoFar) {
            return resultSoFar[attrName];
        }
        const anl = attrName.toLowerCase();
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

        // const iaResult = await generateFakeValueByIA(attrName, attr.type);
        return null;
    },

    fakeModel(modelName, model) {
        const result = {};
        for (const [attrName, attr] of Object.entries(model.attributes)) {
            const fakedAttributeVal = module.exports.fakeAttr(
                attrName,
                attr,
                result,
                model.attributes
            );
            if (fakedAttributeVal !== null && fakedAttributeVal !== undefined) {
                result[attrName] = fakedAttributeVal;
            }
        }
        return result;
    },
};

// const generateFakeValueByIA = async (attrName, attrType) => {
//     const prompt = `Quero gerar um valor de exemplo para um campo de nome "${attrName}" e tipo "${attrType}". Responda com apenas o valor direto, sem explicações.`;

//     try {
//         const response = await axios.post(
//             "https://openrouter.ai/api/v1/chat/completions",
//             {
//                 model: "mistralai/mistral-7b-instruct",
//                 messages: [{ role: "user", content: prompt }],
//             },
//             {
//                 headers: {
//                     Authorization: `Bearer ${process.env.SEED_AI_API_KEY}`,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );

//         return response.data.choices?.[0]?.message?.content?.trim();
//     } catch (err) {
//         console.error("Erro na IA:", err?.response?.data || err.message);
//         return null;
//     }
// };
