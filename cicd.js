

const Promise = require('bluebird');
const assign = require('object-assign-deep');
const CICD = require('sn-cicd');

const rp = require('request-promise');

(function () {
    console.log('process.env.NODE_EXTRA_CA_CERTS', process.env.NODE_EXTRA_CA_CERTS)
    if (!process.env.NODE_EXTRA_CA_CERTS) return;
    try {
        const extraca = require("fs").readFileSync(process.env.NODE_EXTRA_CA_CERTS);
        var NativeSecureContext = process.binding('crypto').SecureContext;
        var oldaddRootCerts = NativeSecureContext.prototype.addRootCerts;
        NativeSecureContext.prototype.addRootCerts = function () {
            var ret = oldaddRootCerts.apply(this, arguments);
            this.addCACert(extraca);
            return ret;
        };
    } catch (e) {
        console.warn("NODE_EXTRA_CA_CERTS not found under", process.env.NODE_EXTRA_CA_CERTS)
    }

})();

/*
    This module is extending sn-cicd (github.com/bmoers/sn-cicd)
    Feel free to add your code to below functions.
    
*/

const _init = CICD.prototype.init;
CICD.prototype.init = function (mode) {
    const self = this;
    return _init.apply(self, arguments).then(() => {
        // do some additional init work
    });
};


CICD.prototype.registerGitHubWebHook = function (repoName) {
    const self = this;
    return Promise.try(() => {

        /*
            THIS IS AN EXAMPLE IMPLEMENTATION TO REGISTER A WEBHOOK DYNAMICALLY.
            DONT USE THIS IN PRODUCTION.
        */

        /*
            check if there is already a webhook registered
        */
        return rp({
            method: 'GET',
            uri: `https://api.github.com/repos/${process.env.CICD_PR_USER_NAME}/${repoName}/hooks`,
            json: true,
            auth: {
                username: process.env.CICD_PR_USER_NAME,
                password: process.env.CICD_PR_USER_PASSWORD
            },
            headers: {
                'User-Agent': process.env.CICD_PR_USER_NAME
            }
        }).then((hooks) => {
            const registered = hooks.some((hook) => hook.name == 'web');
            if (registered)
                return console.log("Hook is already registered.")

            /*
                register the webhook
            */
            return rp({
                method: 'POST',
                uri: `https://api.github.com/repos/${process.env.CICD_PR_USER_NAME}/${repoName}/hooks`,
                json: true,
                auth: {
                    username: process.env.CICD_PR_USER_NAME,
                    password: process.env.CICD_PR_USER_PASSWORD
                },
                headers: {
                    'User-Agent': process.env.CICD_PR_USER_NAME
                }, body: {
                    "name": "web",
                    "active": true,
                    "events": [
                        "pull_request"
                    ],
                    "config": {
                        "url": `https://${process.env.CICD_WEBHOOK_PROXY_SERVER}.${process.env.CICD_WEBHOOK_DOMAIN || 'service-now.com'}/api/devops/cicd/pull_request`,
                        "content_type": "json",
                        "secret": process.env.CICD_WEBHOOK_SECRET,
                        "insecure_ssl": 1
                    }
                }
            }).then((result) => {
                console.log('Hook successfully registered.')
            });

        });

    });
};

CICD.prototype.createRemoteRepo = function (config, repoName) {
    const self = this;
    return Promise.try(() => {
        /*
            code to create remote git repo if required
        */

        return Promise.try(() => {
            /*
                code to create the repo if required
            */
            return rp({
                method: 'GET',
                uri: `https://api.github.com/repos/${process.env.CICD_PR_USER_NAME}/${repoName}`,
                json: true,
                auth: {
                    username: process.env.CICD_PR_USER_NAME,
                    password: process.env.CICD_PR_USER_PASSWORD
                },
                headers: {
                    'User-Agent': process.env.CICD_PR_USER_NAME
                }
            }).then((result) => {
                console.log("repo exists", result.html_url)
            }).catch((e) => {
                if (e.statusCode != 404) {
                    console.error("Somethings not right with the GitHub Access")
                    return;
                }

                console.log("repository does not exist. will create a new one named", repoName);
                return rp({
                    method: 'POST',
                    uri: `https://api.github.com/user/repos`,
                    json: true,
                    auth: {
                        username: process.env.CICD_PR_USER_NAME,
                        password: process.env.CICD_PR_USER_PASSWORD
                    },
                    headers: {
                        'User-Agent': process.env.CICD_PR_USER_NAME
                    },
                    body: {
                        name: repoName,
                        description: 'cicd repo for demo',
                        private: false
                    }
                }).then((result) => {
                    console.log("repo created", result.html_url)
                })
            })
        }).then(() => {
            /*
            THIS IS 'MISUSED' FOR DEMO PURPOSE
            USE THIS METHOD TO CREATE THE REPO IF REQUIRED.

            */
            return self.registerGitHubWebHook(repoName);
        });

    });
};

CICD.prototype.pendingPullRequest = function ({ config, repoName, from }) {
    const self = this;
    /*
        THIS IS AN 'GITHUB' EXAMPLE IMPLEMENTATION
    */
    return Promise.try(() => {
        /*
            code to check if there is already a pending pull request
        */
        return rp({
            method: 'GET',
            uri: `https://api.github.com/repos/${process.env.CICD_PR_USER_NAME}/${repoName}/pulls`,
            json: true,
            auth: {
                username: process.env.CICD_PR_USER_NAME,
                password: process.env.CICD_PR_USER_PASSWORD
            },
            headers: {
                'User-Agent': process.env.CICD_PR_USER_NAME
            }
        }).then(function (result) {
            //console.log(response);
            return result.filter((pr) => {
                return (pr.head.ref == from)
            }).length;
        }).catch((e) => {
            if (e.statusCode != 404) {
                console.error("Somethings not right with the GitHub Access")
                return;
            }
        });
    });
};

CICD.prototype.raisePullRequest = function ({ config, requestor, repoName, from, to, title, description }) {
    const self = this;
    /*
        THIS IS AN 'GITHUB' EXAMPLE IMPLEMENTATION
    */
    return Promise.try(() => {
        /*
            code to raise a pull request
        */
        return rp({
            method: 'POST',
            uri: `https://api.github.com/repos/${process.env.CICD_PR_USER_NAME}/${repoName}/pulls`,
            json: true,
            auth: {
                username: process.env.CICD_PR_USER_NAME,
                password: process.env.CICD_PR_USER_PASSWORD
            }, body: {
                title: title,
                head: from,
                base: to,
                body: description
            },
            headers: {
                'User-Agent': process.env.CICD_PR_USER_NAME
            }
        }).then(function (response) {
            console.log('Pull request raised', response.url);
            return response;
        });
    });
};



/**
 * Get all files of an application.
 *  The result contains all scoped and non-scoped files linked to an application
 * 
 * @param {Object} application 
 * @returns {Promise<Array>} a list of files
 *//*
CICD.prototype.getApplicationFiles = function (ctx) {
return Promise.try(() => {

//code to export all "master" file information in a format of
//[{
//    className: 'sys_script_include',
//    sysId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
//}]
return [];
});
};
*/

/**
 * Get all ATF test suites existing on the SOURCE environment
 * @param {*} config 
 *//*
CICD.prototype.getApplicationTestSuites = function (config) {
return Promise.try(() => {

//code to export all test suite information in a format of
// [{ 
//    className: 'className',
//    sysId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
// }]
return [];
});
};
*/

/**
 * Get all ATF test cases existing on the SOURCE environment
 * @param {*} config 
 *//*
CICD.prototype.getApplicationTests = function (config) {
return Promise.try(() => {
//code to export all test information in a format of
//[{
//    className: 'className',
//    sysId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
//}]
return [];
});
};
*/

CICD.prototype.convertBuildBody = function (body) {
    return Promise.try(() => {
        // console.log(body);
        var requestParam = assign({
            requestor: {
                userName: null,
                fullName: null,
                email: null
            },
            atf: {
                name: null,
                updateSetOnly: false
            },
            updateSet: null,
            application: {
                id: null,
                name: null,
                organization: null
            },
            git: {
                repository: null,
                remoteUrl: null
            },
            source: {
                name: null,
            },
            master: {
                name: null,
            },
            target: {
                name: null,
            }
        }, body);

        var options = {
            build: {
                requestor: requestParam.requestor
            },
            atf: {
                updateSetOnly: requestParam.atf.updateSetOnly
            },
            updateSet: requestParam.updateSet,
            application: {
                id: requestParam.application.id,
                name: requestParam.application.name,
                organization: "company"
            },
            git: {
                repository: requestParam.git.repository,
                remoteUrl: requestParam.git.remoteUrl,
                enabled: requestParam.git.enabled === undefined ? (Boolean(requestParam.git.repository)) : requestParam.git.enabled,
                pullRequestEnabled: requestParam.git.pullRequestEnabled === undefined ? (Boolean(requestParam.git.repository)) : requestParam.git.pullRequestEnabled
            },
            host: {
                name: requestParam.source.name
            }
        };
        if (requestParam.master.name) {
            options.master = {
                name: "master",
                host: {
                    name: requestParam.master.name
                }
            };
        }
        if (requestParam.target.name) {
            options.deploy = {
                host: {
                    name: requestParam.target.name
                }
            };
        }

        //console.log('convertBuildBody:')
        //console.log('%j', options);
        return options;
    });
};

CICD.prototype.gitPullRequestProxyConvertBody = function (body) {
    return Promise.try(() => {
        /*
           whatever it needs to convert the inbound body to 
           the correct format to internally call gitPullRequestUpdate()
       */
        /*
            {
                "action": "DECLINED",
                "comment": "",
                "request": {
                    "id": "7",
                    "name": "Virtual Application - APP - 1.1.4 (Boris Moers) #2",
                    "url": "https://git.swissre.com/projects/SNOW/repos/sn_virtual_application/pull-requests/7"
                },
                "author": {
                    "name": "Boris Moers"
                },
                "reviewers": "Abishek Singh,Boris Moers,Gurpreet Matharu,Martin Frain,Nisha Vickraman,Rajiv H R,Shiva Prasadr,Vishwanathan Vijayabarath",
                "source": {
                    "project": "SNOW",
                    "repository": "sn_virtual_application",
                    "branch": "virtual-application---app---1-1-4-@87cf4f03dbe52b00323efc600f961966"
                },
                "target": {
                    "project": "SNOW",
                    "repository": "sn_virtual_application",
                    "branch": "master"
                }
}
        */
        const gitPayload = body;
        const pr = gitPayload.pull_request;

        if (!pr)
            return {};

        return assign({
            action: undefined,
            comment: undefined,
            mergeId: undefined,
            request: {
                id: undefined,
                name: undefined,
                url: undefined
            },
            author: {
                name: undefined
            },
            reviewers: [],
            source: {
                project: undefined,
                repository: undefined,
                branch: undefined
            },
            target: {
                project: undefined,
                repository: undefined,
                branch: undefined
            }
        }, {
            action: (gitPayload.action == 'closed' && pr.merged) ? 'merged' : (gitPayload.action == 'closed' && !pr.merged) ? 'declined' : gitPayload.action,
            mergeId: pr.merge_commit_sha,
            request: {
                id: pr.number,
                name: pr.title,
                url: pr.html_url
            },
            author: {
                name: pr.user.login
            },
            source: {
                project: pr.head.repo.full_name.split('/')[0],
                repository: pr.head.repo.full_name.split('/')[1],
                branch: pr.head.ref
            },
            target: {
                project: pr.base.repo.full_name.split('/')[0],
                repository: pr.base.repo.full_name.split('/')[1],
                branch: pr.base.ref
            }
        });
    });
};

module.exports = CICD;
