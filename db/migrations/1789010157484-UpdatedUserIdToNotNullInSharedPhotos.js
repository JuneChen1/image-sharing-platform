/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class UpdatedUserIdToNotNullInSharedPhotos1789010157484 {
    name = 'UpdatedUserIdToNotNullInSharedPhotos1789010157484'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "FK_c94b7bee91860c402d63d774cb5"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "FK_c94b7bee91860c402d63d774cb5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" DROP CONSTRAINT "FK_c94b7bee91860c402d63d774cb5"`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ADD CONSTRAINT "FK_c94b7bee91860c402d63d774cb5" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
}
