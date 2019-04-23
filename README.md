# Example implementation of the CICD-Server V3 for ServiceNow


## Table of contents

- [Features](#features)
- [Example Pipeline](#example-pipeline)
- [Demo Video](#demo-video)
- [Before you start](#before-you-start)
    - [Prerequisites](#prerequisites)
    - [Install the Scoped App](#install-the-scoped-app)
    - [Configure the CICD-Integration in ServiceNow](#configure-the-cicd-integration-in-servicenow)
    - [Install the CICD-Server](#install-the-cicd-server)
- [Configure the CICD-Server](#configure-the-cicd-server)
- [Start the CICD-Server](#start-the-cicd-server)
    - [Docker](#docker)
- [Quick Start](#quick-start)
- [Configure ServiceNow to 'build' a scoped application](#Configure-ServiceNow-to-'build'-an-Update-Set)
- [Prerequisites](#prerequisites)
- [Contribute](#contribute)
- [Dependencies](#dependencies)

## Features

This is an example implementation of the [CICD-Server](https://github.com/bmoers/sn-cicd) for [ServiceNow](https://www.servicenow.com/). It allows to send changes, captured in Update-Sets in ServiceNow, to a CICD pipeline including running ATF test cases in ServiceNow.\
Example build results:
- [Code extraction](https://github.com/bmoers/sn-cicd-example-v3/tree/master/example/repo)
- [ESLint report](http://htmlpreview.github.io/?https://github.com/bmoers/sn-cicd-example-v3/blob/master/example/doc/lint/index.html)
- [JsDoc documentation](http://htmlpreview.github.io/?https://github.com/bmoers/sn-cicd-example-v3/blob/master/example/doc/docs/global.module_sys_script_include.CicdDemo.html)

More information about the core module can be found here https://github.com/bmoers/sn-cicd#cicd-server-for-service-now-v3

A video recording from the K18 session, where CICD-Server version 1 was presented, can be found [here](https://youtu.be/8v6zc2Qgjm4).


## Example Pipeline
In this example you're going to:
- extract an scoped app into a GIT repository
- run a CICD pipeline to test the code quality, document the code and run ATF tests
- do code review
- raise a pull request against master (the status of the code in the production environment)
- deploy the scoped app

 As the code is stored in a GIT repo, one can also hook in other standard CICD build tools to trigger further actions like performance or UAT.\
 The process requires two environment. One acts as 'source' (the development environment) - one acts as 'master' and 'target' environment. This is just to simplify the demo setup.

## Demo Video
[![A recording of this how-to](http://img.youtube.com/vi/u5I-fxvMcX4/0.jpg)](http://www.youtube.com/watch?v=u5I-fxvMcX4)


## Before you start

### Prerequisites
- Minimum 2 ServiceNow instances. 1 as DEV, 1 as PROD.
- The Dev instance has a running and validated MID server.
- The host of the CICD-Server (in this demo this is your PC) can be reached by the MID server.
- A [GitHub](https://github.com) account.
- A Access token for your this GitHub account with the privileges repo, admin:repo_hook, admin:org_hook. (Goto https://github.com/settings/tokens to configure one)
- Git client installed and configured to connect to [Github via SSH](https://help.github.com/en/articles/connecting-to-github-with-ssh)
- The [CICD Integration app](https://github.com/bmoers/sn-cicd-integration/blob/master/update_set/CICD%20Integration.xml) installed on all ServiceNow instances.
- ATF Test Suite Execution is enabled on all environment under 'Automated Test Framework > Administration > [Properties](https://customer.service-now.com/system_properties_ui.do?sysparm_title=Automated%20Test%20Framework%20Properties&sysparm_category=Test%20and%20Test%20Suite%20Properties)'

### Install the Scoped App
- Install the latest version of the CICD-Integration app from [GitHub](https://github.com/bmoers/sn-cicd-integration/blob/master/update_set/CICD%20Integration.xml) on all ServiceNow environments (source and target). Alternatively you can clone the [CICD-Integration](https://github.com/bmoers/sn-cicd-integration) repo and install the update-set from ./update_set/CICD Integration.xml.
- On all instances configure following users: *(for testing purpose you can also skip below and use the 'admin' user later in the configuration)*
    - Create a CI-User account in ServiceNow and assign it to the `cicd_integration_user` group.
    - Create a ATF-User account in ServiceNow and assign it to the `atf_test_*` and `impersonator` groups.
    - Create a CD-User account in ServiceNow and assign it to the `admin` **!** group

### Configure the CICD-Integration in ServiceNow
Navigate to 'CICD Integration > Properties' and enable at least following:
- [x] CICD Integration enabled 
- [x] Show CICD UI action in scoped apps 
- [x] Trigger CICD process on update set 'complete'
- Enter the CICD-Server Host Name (the host / IP of your PC). If you use Docker or have a MID server running on your PC this can be https://localhost:8443
- [x] Connect to CICD-Server via MID Server
- [x] Show JSDoc button in UI to support developer to comment code correctly
- [x] Pull Request Proxy switch


### Install the CICD-Server
- Get a copy of this repo:
```bash
git clone git@github.com:bmoers/sn-cicd-example-v3.git

cd sn-cicd-example-v3
```

## Configure the CICD-Server
- **Rename `example.env` to `.env`**\
    This file contains all credentials and necessary information to run the CICD-Server. Make sure you **never** commit it to a GIT repo.

> Assuming two ServiceNow environments
> - dev12345.service-now.com The Dev instance (&lt;dev12345-dev-instance;&gt;)
> - dev23456.service-now.com The Prod instance (&lt;dev23456-prod-instance;&gt;)
> 

Add following information to the .env file:


```bash
# ----- !! REQUIRED !! -----
# github credentials
CICD_PR_USER_NAME=<github-user-id>
# the github token (or password)
CICD_PR_USER_PASSWORD=<******************************>
# ServiceNow host name - this host acts as proxy to route the web hooks to the CICD-Server (via MID)
CICD_WEBHOOK_PROXY_SERVER=<dev12345-dev-instance>
# Secret (see cicd-integration properties in ServiceNow)
CICD_WEBHOOK_SECRET=5VCSj9SPRH3EbNHrBSTf
#GitHub project information
CICD_GIT_HOST=git@github.com:<github-user-id>/
CICD_GIT_URL=https://github.com/<github-user-id>/

# default git master source - let this point to production environment
CICD_GIT_MASTER_SOURCE=<dev23456-prod-instance>.service-now.com

# user to run the ATF test cases
CICD_ATF_TEST_USER_NAME=admin
CICD_ATF_TEST_USER_PASSWORD=<***********>

# user to load update-set form 'source' and 'master'
CICD_CI_USER_NAME=admin
CICD_CI_USER_PASSWORD=<***********>

# user to deploy update-set to 'target'
CICD_CD_USER_NAME=admin
CICD_CD_USER_PASSWORD=<***********>

# deployment target definition
CICD_CD_DEPLOYMENT_TARGET=<dev23456-prod-instance>.service-now.com

# ----- ** OPTIONAL ** -----
# toggle slack integration
CICD_SLACK_ENABLED=true
# webhook url
CICD_SLACK_WEBHOOK=https://hooks.slack.com/services/<********>/<********>/<*****************************>

```

## Start the CICD-Server

In sn-cicd-example-v3 run:

```bash
npm install
```

and:

```bash
npm start
```

The web-UI is available under http://localhost:8080/ (depending of your server-options settings).\
If HTTPS is enabled you might see a "page not secure" warning. This is due to self signed certificates in this example project.\
It requires a run at least one build to display any information.

## Docker
If you'd like to run the CICD-Server as a Docker container please have a look at the Dockerfile. Use Docker Compose to also start a MID server.

## Trigger a CICD Run

TL;DR: 
* Install the [example application](https://github.com/bmoers/sn-cicd-example-v3/tree/master/example/cicd_test_application_sys_remote_update_set.xml) 
* open the App (/sys_app.do?sys_id=CICD%20Test%20Application) 
* click on "Build this Application [CICD]"

Or create the app manually:
1. Logon to a ServiceNow instance dev12345.service-now.com (get a personal developer instance on https://developer.servicenow.com/).
2. Create a Scoped App.\
    Navigate to "System Applications > Applications" and select "New > Start from scratch". Name it "CICD Global Test App".
3. Add some files to it like e.g business rule or script include. Use the the UI Action with the 'Box' icon to automatically comment the code.
4.  In the left navigation, open this Application definition again. "System Applications > Applications", click on "CICD Global Test App".
5. Trigger the CICD Pipeline by just clicking on the "Build this Application [CICD]" UI Action.
6. This will now :
    - extract the code from 'master'
    - create an 'update set' branch and extract the update set into it
    - build the app (EsLint, JsDoc, Mocha [ATF])
7. Once all test are 'green' a pull request will be raised against master.
    - If you have Slack enabled in the configuration above you'll see corresponding messages
8. Navigate now to GitHub, open the pull request and review the code.
9. If you're happy with it, approve the pull request.
10. The 'update set' branch will be merged with the 'master' branch.  
11. The application (update set) is now automatically deployed.


## Contribute

If you want to contribute to this project, please fork the core project https://github.com/bmoers/sn-cicd 

## Project dependencies
The project is designed to use extensions. The core project [(bmoers/sn-cicd)](https://github.com/bmoers/sn-cicd) contains all 'shared' features. Customization which are dedicated to your ServiceNow environment or CICD pipeline shall be added to the 'extending' project (like this one.)

### Dependencies

https://github.com/bmoers/sn-cicd-example-v3 \
--> extends  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/bmoers/sn-cicd \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;--> uses  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/bmoers/sn-project \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;https://github.com/bmoers/sn-rest-client
