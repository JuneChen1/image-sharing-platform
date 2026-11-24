/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class AddUploadSupportToSharedPhotos1795501471836 {
    name = 'AddUploadSupportToSharedPhotos1795501471836'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD "source_type" character varying(20) NOT NULL DEFAULT 'unsplash'`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD "file_key" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "UQ_07f91bb0afdd483d9a47d69b8e2" UNIQUE ("file_key")`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD "is_original" boolean`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD "origin_url" character varying(2048)`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD "note" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ADD "source_type" character varying(20) NOT NULL DEFAULT 'unsplash'`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "UQ_unsplash_id_user_pair"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "unsplash_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "unsplash_page_url" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "photographer_name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "photographer_url" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ALTER COLUMN "unsplash_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ALTER COLUMN "unsplash_page_url" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ALTER COLUMN "photographer_name" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "CHK_shared_photos_source_type" CHECK ("source_type" IN ('unsplash', 'upload'))`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "CHK_shared_photos_unsplash_fields" CHECK ("source_type" <> 'unsplash' OR ("unsplash_id" IS NOT NULL AND "unsplash_page_url" IS NOT NULL AND "photographer_name" IS NOT NULL AND "photographer_url" IS NOT NULL))`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "CHK_shared_photos_upload_fields" CHECK ("source_type" <> 'upload' OR ("file_key" IS NOT NULL AND "is_original" IS NOT NULL))`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "CHK_shared_photos_origin_url" CHECK ("is_original" IS DISTINCT FROM false OR "origin_url" IS NOT NULL)`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ADD CONSTRAINT "CHK_deleted_shared_photos_source_type" CHECK ("source_type" IN ('unsplash', 'upload'))`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ADD CONSTRAINT "CHK_deleted_shared_photos_unsplash_fields" CHECK ("source_type" <> 'unsplash' OR ("unsplash_id" IS NOT NULL AND "unsplash_page_url" IS NOT NULL AND "photographer_name" IS NOT NULL))`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "UQ_unsplash_id_user_pair" UNIQUE ("unsplash_id", "user_id")`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "UQ_unsplash_id_user_pair"`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" DROP CONSTRAINT "CHK_deleted_shared_photos_unsplash_fields"`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" DROP CONSTRAINT "CHK_deleted_shared_photos_source_type"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "CHK_shared_photos_origin_url"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "CHK_shared_photos_upload_fields"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "CHK_shared_photos_unsplash_fields"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "CHK_shared_photos_source_type"`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ALTER COLUMN "photographer_name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ALTER COLUMN "unsplash_page_url" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ALTER COLUMN "unsplash_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "photographer_url" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "photographer_name" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "unsplash_page_url" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "unsplash_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "UQ_unsplash_id_user_pair" UNIQUE ("unsplash_id", "user_id")`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" DROP COLUMN "source_type"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP COLUMN "note"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP COLUMN "origin_url"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP COLUMN "is_original"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "UQ_07f91bb0afdd483d9a47d69b8e2"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP COLUMN "file_key"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP COLUMN "source_type"`);
    }
}
