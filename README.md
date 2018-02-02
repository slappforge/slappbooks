# Slappbooks
Slappbooks is an accounting application developed to demonstrate the capabilities of Sigma IDE of SLAppForge. This repository includes the backend lambda files required to deploy the application. The front-end reactjs based application can be found at https://github.com/slappforge/slappbooks-frontend.

## Getting Started 
These instructions will get you a copy of the project up and running for development and testing purposes.

In order to get started you will have to deploy the lambda application using the Sigma IDE of SLAppForge. You will be able to achieve this by following the steps mentioned below. After you've deployed the lambda functions, navigate to the [API gateway of AWS](https://aws.amazon.com/api-gateway/) and find the end point URL of `slappbooksapi`.

Afterwards include that URL in the env file and build the front-end application by following the instructions given at the [front-end repo](https://github.com/slappforge/slappbooks-frontend).

### Prerequisites
All deployments are based on [Amazon AWS](https://aws.amazon.com/). To open the project, you will need the Sigma IDE which can be found at https://slappforge.adroitlogic.com. You will need to create an account and provide your AWS credentials to open the project (Your AWS credentials will not be acquired by SLAppForge under any circumstances).

### Deployment 
Click on the deployment button and it should deploy all lambdas that are required to run the application. 

## Authors
* **Malith Jayaweera**

## License
This project is licensed under the Apache License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments
* Awesome SLAppForge team
