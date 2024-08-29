const {ApolloServer, gql} = require("apollo-server");
const { ApolloServerPluginLandingPageGraphQLPlayground } = require('apollo-server-core');
const { createSchema, createYoga } = require('graphql-yoga');
const { createServer } = require('node:http');
const { PubSub } = require('graphql-subscriptions');
const pubsub = new PubSub(); 


const data = require('./data');

// const typeDefs = `

    
// `;


const yoga = createYoga({
    schema: createSchema({
      typeDefs: /* GraphQL */ `
    type User {
        id : Int!,
        username : String!,
        email : String!,
        events(id : Int) : [Event]
    }

    type Participant {
        id : Int!
        username : String,
        event_id : Int!
    }

    type Location {
        id : Int!,
        name : String!
    }

    type Event {
        id : Int!,
        title : String!,
        user : User!,
        location_id : Int!
        participants :  [Participant!],
        location : Location!
    }
    type Query {
        user(id : Int) : [User],
        event(id : Int) : [Event],
        location(id : Int) : [Location],
        participant(id :Int) : [Participant] 
    }
    
    type Mutation {
        createUser(id : Int, username : String!, email : String!) : User!
    }

    type Subscription {
        userCreated : User
    }
      `,
      resolvers:  {
        Subscription : {
            userCreated: {
                subscribe : (_,__, { pubsub }) => pubsub.asyncIterator('userCreated'),
                resolve: (payload, args) => {
                    if(payload.userCreated && payload.userCreated.username === "ali") {
                        console.log(payload.userCreated);
                        
                        return payload.userCreated;
                    }
                    
                    return null;
                  }
            }
        },


        Query : {
            user : (parent,args) => args.id ? [data.users.find((user) => user.id === args.id)] : data.users, //{
            location : (parent,args) => args.id ? [data.locations.find((location) => location.id === args.id)] : data.locations,
            participant : (parent,args) => args.id ? [data.participants.find((participant) => participant.id === args.id)] : data.participants,
            event : (parent,args) => args.id ? [data.events.find((event) => event.id === args.id)] : data.events
        },
        User : {
            events : (parent,args) => {
                if(args.id) {
                    let filtered = data.events.filter((event) => event.user_id === parent.id);
                    return filtered.filter((event) => event.id === args.id);
                }else {
                    return data.events.filter((event) => event.user_id === parent.id)
                }
            }
        },
        Event : {
            participants : (parent) => data.participants.filter((participants) => participants.event_id === parent.id),
            user : (parent) =>  data.users.find((user) => parent.user_id === user.id),
            location : (parent) => data.locations.find((location) => parent.location_id === location.id)
        },
        Participant :{
            username : (parent) => data.users.find((user) => user.id === parent.user_id ).username
        },
        Mutation : {
            createUser : (parent,args) => {
                const user = {
                    id : args.id,
                    username : args.username,
                    email : args.email
                };
    
                data.users.push(user);
                pubsub.publish('userCreated', {userCreated : user});


                return user;
            }
        }
    
    
    
    }
    }),
    context: {
        pubsub, // context içinde pubsub'ı sağlıyoruz
    },
  })
  

// const resolvers = {
//     Query : {
//         user : (parent,args) => args.id ? [data.users.find((user) => user.id === args.id)] : data.users, //{
//         location : (parent,args) => args.id ? [data.locations.find((location) => location.id === args.id)] : data.locations,
//         participant : (parent,args) => args.id ? [data.participants.find((participant) => participant.id === args.id)] : data.participants,
//         event : (parent,args) => args.id ? [data.events.find((event) => event.id === args.id)] : data.events
//     },
//     User : {
//         events : (parent,args) => {
//             if(args.id) {
//                 let filtered = data.events.filter((event) => event.user_id === parent.id);
//                 return filtered.filter((event) => event.id === args.id);
//             }else {
//                 return data.events.filter((event) => event.user_id === parent.id)
//             }
//         }
//     },
//     Event : {
//         participants : (parent) => data.participants.filter((participants) => participants.event_id === parent.id),
//         user : (parent) =>  data.users.find((user) => parent.user_id === user.id),
//         location : (parent) => data.locations.find((location) => parent.location_id === location.id)
//     },
//     Participant :{
//         username : (parent) => data.users.find((user) => user.id === parent.user_id ).username
//     },
//     Mutation : {
//         createUser : (parent,args) => {
//             const user = {
//                 id : args.id,
//                 username : args.username,
//                 email : args.email
//             };

//             data.users.push(user);

//             return user;
//         }
//     }



// };


// const server = new ApolloServer({
//     typeDefs,
//     resolvers,
//     introspection: true,  // introspection özelliğini etkinleştir
//     plugins: [
//       ApolloServerPluginLandingPageGraphQLPlayground()  // GraphQL Playground'u etkinleştir
//     ],     
// });



const server = createServer(yoga);

server.listen(4000, () => {
  console.info('Server is running on http://localhost:4000/graphql')
})

// server.listen(3000).then(() => console.log("SERVER CALISTI"))
