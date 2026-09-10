/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class AddUQUnsplashIdUserInSharedPhotos1789011255604 {
    name = 'AddUQUnsplashIdUserInSharedPhotos1789011255604'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "UQ_unsplash_id_user_pair" UNIQUE ("unsplash_id", "user_id")`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "UQ_unsplash_id_user_pair"`);
    }
}
