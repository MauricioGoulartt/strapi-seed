"use strict";

module.exports = [
    {
        method: "GET",
        path: "/up",
        handler: "myController.up",
        config: {
            auth: false,
        },
    },
    {
        method: "GET",
        path: "/down",
        handler: "myController.down",
        config: {
            auth: false,
        },
    },
];
