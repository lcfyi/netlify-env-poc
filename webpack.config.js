const Dotenv = require('dotenv-webpack');

module.exports = {
    // Default outputs, no need to set entry/output
    plugins: [
        new Dotenv({
            systemvars: true // Grab system vars for build
        })
    ]
};