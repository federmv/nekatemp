module.exports = {
    apps: [
        {
            name: "server",
            script: "backend/server.js",
            env: {
                NODE_ENV: "production"
            }
        },
        {
            name: "mqtt_worker",
            script: "backend/mqtt_worker.js",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};
