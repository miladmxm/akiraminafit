import { auth } from "./auth";
import { env } from "./env";

// todo : auth.api.createUser
const findUser = await auth.api.listUsers({ query: { searchField: "email", searchValue: env.ADMIN_EMAIL } })
console.log(findUser)
// if (findUser.total === 0) {
//     await auth.api.createUser({
//         body: {
//             email: env.ADMIN_EMAIL,
//             name: env.ADMIN_NAME,
//             password: env.ADMIN_PASSWORD,
//             role: "coach"
//         }
//     })
// }
