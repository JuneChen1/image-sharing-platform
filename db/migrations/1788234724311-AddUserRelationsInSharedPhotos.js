/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class AddUserRelationsInSharedPhotos1788234724311 {
    name = 'AddUserRelationsInSharedPhotos1788234724311'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD "user_id" uuid`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "FK_c94b7bee91860c402d63d774cb5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "FK_c94b7bee91860c402d63d774cb5"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP COLUMN "user_id"`);
    }
}
