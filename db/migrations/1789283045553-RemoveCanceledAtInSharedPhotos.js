/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class RemoveCanceledAtInSharedPhotos1789283045553 {
    name = 'RemoveCanceledAtInSharedPhotos1789283045553'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP COLUMN "canceled_at"`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD "canceled_at" TIMESTAMP`);
    }
}
