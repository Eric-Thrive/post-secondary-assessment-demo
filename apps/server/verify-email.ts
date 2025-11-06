// Minimal verify-email.ts to fix compilation errors
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { db, pool } from "./db";

async function verifyEmail() {
  try {
    console.log("Looking for Pippa user...");
    
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, "Pippa"));

    if (!user) {
      console.log("User 'Pippa' not found");
      process.exit(1);
    }

    if (user.emailVerified) {
      console.log("✅ Email is already verified!");
      con);
...ilfying emanVerig("\sole.lo

    con0);
    }.exit( process  end();
    pool.   await;
   !")ifiedady verlre✅ Email is a"\nog(   console.l) {
   mailVerified(user.e if ;

   ied)ailVerif", user.em Verified:il"Emansole.log(
    coer.email);", usil:("Emansole.log;
    co.username)ser:", useround ulog("F  console.   }

  (1);
 s.exit proces");
     oundpa' not f"User 'Pipg(sole.lo{
      con(!user) 
    if a"));
Pipprname, "users.usehere(eq(  .w
    users)rom()
      .f    .select(
   await dbt [user] =  cons

  ;")ppa user... Pioking forog("Lo   console.ly {
 
  trmail() {on verifyEuncti
async f
le-orm";from "drizz { eq } ;
imported/schema"ar"@shrom  { users } fport
im./db"; } from " db, poolmport {i