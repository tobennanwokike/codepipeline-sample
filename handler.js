'use strict';
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: process.env.AWS_REGION })
const ddbDocClient = DynamoDBDocumentClient.from(client);
const NOTES_TABLE_NAME = process.env.NOTES_TABLE_NAME;

const send = (statusCode, data) => {
  return {
    statusCode,
    body: JSON.stringify(data)
  };
}

module.exports.createNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = true;
  let data = JSON.parse(event.body);
  try{
    const params = {
      TableName: NOTES_TABLE_NAME,
      Item: {
        notesId: data.id,
        title: data.title,
        body: data.body
      },
      ConditionExpression: "attribute_not_exists(notesId)"
    };
    await ddbDocClient.send(new PutCommand(params));
    return send(201, data);
  }
  catch(err){
    return send(500, err.message);
  }
};

module.exports.updateNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = true;
  let notesId = event.pathParameters.id;
  let data = JSON.parse(event.body);
  try{
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      UpdateExpression: "set #title = :title, #body = :body",
      ExpressionAttributeNames: {
        "#title": "title",
        "#body": "body"
      },
      ExpressionAttributeValues: {
        ":title": data.title,
        ":body": data.body
      },
      ConditionExpression: "attribute_exists(notesId)"
    };
    await ddbDocClient.send(new UpdateCommand(params));
    return send(200, data);
  }
  catch(err){
    return send(500, err.message);
  }
};

module.exports.deleteNote = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = true;
  let notesId = event.pathParameters.id;
  try{
    const params = {
      TableName: NOTES_TABLE_NAME,
      Key: { notesId },
      ConditionExpression: "attribute_exists(notesId)"
    };
    await ddbDocClient.send(new DeleteCommand(params));
    return send(200, {message: `Note with id ${notesId} was deleted`});
  }
  catch(err){
    return send(500, err.message);
  }
};

module.exports.getAllNotes = async (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = true;
  try{
    const params = {
      TableName: NOTES_TABLE_NAME
    };
    const notes = await ddbDocClient.send(new ScanCommand(params));
    return send(200, notes.Items);
  }
  catch(err){
    return send(500, err.message);
  }
};