const { CognitoJwtVerifier } = require("aws-jwt-verify");

const jwtVerifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USERPOOL_ID,
    tokenUse: "id",
    clientId: process.env.COGNITO_WEB_CLIENT_ID
});

const generatePolicy = (principalId, effect, resource) => {
    let authResponse = {};
    authResponse.principalId = principalId;

    if(effect && resource){
        let policyDocument = {
            Version: "2012-10-17",
            Statement: [
                {
                    Effect: effect,
                    Resource: resource,
                    Action: "execute-api:invoke",
                }
            ],
        };
        authResponse.policyDocument = policyDocument;
    }
    authResponse.context = {
        foo: "bar"
    }
    console.log(JSON.stringify(authResponse));
    return authResponse;
};

module.exports.handler = async (event, context, cb) => {
    // add authorizer code here
    const token = event.authorizationToken;
    console.log(token);

    try{
        const payload = await jwtVerifier.verify(token);
        console.log(JSON.stringify(payload));
        return generatePolicy("user", "Allow", event.methodArn);
    }
    catch(err){
        return "Authorization Failed";  
    }

    // switch(token){
    //     case 'allow':
    //         return generatePolicy("user", "Allow", event.methodArn);
    //     case 'deny':
    //         return generatePolicy("user", "Deny", event.methodArn);  
    //     default:
    //         return "Authorization Failed";  
    // }
};