
const defaultConfig = require('sn-cicd/lib/project-templates/build-config.js');
/*
defaultConfig.files.push({
    "source": "Jenkinsfile",
    "target": "Jenkinsfile"
})
*/
defaultConfig.files.push({
    "source": ".gitlab-ci.yml",
    "target": ".gitlab-ci.yml"
})

module.exports = defaultConfig;
