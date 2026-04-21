-- CreateEnum
CREATE TYPE "AuthSource" AS ENUM ('local', 'ldap');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "auth_source" "AuthSource" NOT NULL DEFAULT 'local';

-- CreateTable
CREATE TABLE "ldap_config" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "server_url" TEXT NOT NULL,
    "bind_dn" TEXT NOT NULL,
    "bind_password" TEXT NOT NULL,
    "search_base" TEXT NOT NULL,
    "search_filter" TEXT NOT NULL DEFAULT '(sAMAccountName={{username}})',
    "email_attribute" TEXT NOT NULL DEFAULT 'mail',
    "name_attribute" TEXT NOT NULL DEFAULT 'displayName',
    "default_role" "Role" NOT NULL DEFAULT 'user',
    "sync_enabled" BOOLEAN NOT NULL DEFAULT false,
    "tls_reject_unauthorized" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ldap_config_pkey" PRIMARY KEY ("id")
);
