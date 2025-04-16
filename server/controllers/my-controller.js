"use strict";

module.exports = ({ strapi }) => ({
    async up(ctx) {
        strapi.log.info("🔥 Executando seed...");
        await strapi.plugin("strapi-faker").service("myService").up();
        ctx.send("Strapi-faker up triggered. Check out the server console!");
    },

    async down(ctx) {
        strapi.log.info("🔥 Executando seed...");
        await strapi.plugin("strapi-faker").service("myService").down();
        ctx.send("Strapi-faker down triggered. Check out the server console!");
    },
});
