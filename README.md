# JWT Generator

## High Level
This Worker generates 2 types of webtokens for the Zendesk SDK and the Chat SDK/Webwidget respectively. 

They assume a trusted environment we're the SSO happens before this service is called.
We assume that the app or website that calls these endpoints already handled the authentication and that we can return a status 201 trusted.

The script contains the Token (SDK) or Shared Secret (Chat and Widget)

We return
- Status 200 for POST to the /sdk endpoint with a valid payload
- Status 200 for POST to the /chat endpoint with a valid payload
- Status 401 for any error we find, which results in an unauthorized user in the SDK or Widget
- This readme file for a GET request.

## References
- [JWT Endpoint for Mobile SDK](https://develop.zendesk.com/hc/en-us/articles/360001075248-Building-a-dedicated-JWT-endpoint-for-the-Support-SDK)
- [Authenticated users in Chat SDK](https://develop.zendesk.com/hc/en-us/articles/360052354433-Enabling-authenticated-users-with-the-Chat-SDK-)
- [Authentiated Visitors in Widget](https://support.zendesk.com/hc/en-us/articles/360022185314-Enabling-authenticated-visitors-in-the-Chat-widget)

## SDK
The Zendesk Mobile SDK requires a JWT endpoint for authenticating its users.
It sends a payload to the endpoint. The payload contains a user identifier.

This can either be:
- the UUID of the user in the authentication service (which requires an extension of this script to retrieve the email and name of the user)
- an email adres of the user. 

We use the latter in our script for simplicities sake.

    {"user_token":"john@example.com"}
    
The endpoint is found at https://jwt.verschoren.com/sdk

It returns the following when handling a POST

### Status 201

     {"jwt": "abc123def456...."}

which has a decoded structure of

     {
       "jti": random_string,
       "iat": current_time_in_seconds,
       "name": user_token,
       "email": user_token
     }

### Status 401
If the past token can't be found we send a status 401 which will be handled as unauthorized by the SDK

## Chat or Widget
The Zendesk Chat SDK and the Widget requires a JWT endpoint for authenticating its users.
It sends a payload to the endpoint. The payload contains email, name and an external_id
The external_id can be anything but is preferably the UUID of the user in the authentication service so we can extend the code to validate the user.

    {"name":"John Appleseed","email":"john@example.com","external_id":"123456"}
    
The endpoint is found at https://jwt.verschoren.com/chat

It returns the following when handling a POST

### Status 201

     {"jwt": "abc123def456...."}

which has a decoded structure of

     {
       "iat": current_time_in_seconds,
       "name": name,
       "email": email,
       "external_id": external_id,
     }

### Status 401
If the past token can't be found we send a status 401 which will be handled as unauthorized by the SDK
