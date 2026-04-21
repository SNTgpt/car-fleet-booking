-- AlterTable
ALTER TABLE "ldap_config" ADD COLUMN     "sync_interval_min" INTEGER NOT NULL DEFAULT 30;
