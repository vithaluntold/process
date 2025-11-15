/**
 * Script to create a test user for development/testing
 * Usage: tsx scripts/create-test-user.ts
 */

import { db } from "../lib/db";
import * as schema from "../shared/schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

async function createTestUser() {
  const testEmail = "test@epiq.com";
  const testPassword = "Test@123";
  
  try {
    console.log("🔍 Checking if test user already exists...");
    
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, testEmail));
    
    if (existingUser) {
      console.log("✅ Test user already exists!");
      console.log("📧 Email:", testEmail);
      console.log("🔑 Password:", testPassword);
      console.log("\n🎯 Use these credentials to login on the landing page.");
      return;
    }
    
    console.log("🔐 Hashing password...");
    const hashedPassword = await hash(testPassword, 10);
    
    // Get or create default organization
    console.log("🏢 Ensuring default organization exists...");
    let [organization] = await db
      .select()
      .from(schema.organizations)
      .where(eq(schema.organizations.id, 2));
    
    if (!organization) {
      console.log("🏢 Creating default organization...");
      [organization] = await db
        .insert(schema.organizations)
        .values({
          name: "EPI-Q Test Organization",
          subscriptionTier: "ENTERPRISE",
          subscriptionStatus: "active",
        })
        .returning();
    }
    
    console.log("👤 Creating test user...");
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email: testEmail,
        password: hashedPassword,
        firstName: "Test",
        lastName: "User",
        role: "admin",
        organizationId: organization.id,
      })
      .returning();
    
    console.log("\n✅ Test user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email:    ", testEmail);
    console.log("🔑 Password: ", testPassword);
    console.log("👤 Role:     ", newUser.role);
    console.log("🏢 Org ID:   ", newUser.organizationId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🎯 Use these credentials to login on the landing page.");
    
  } catch (error) {
    console.error("❌ Error creating test user:", error);
    process.exit(1);
  }
}

createTestUser()
  .then(() => {
    console.log("\n✨ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
