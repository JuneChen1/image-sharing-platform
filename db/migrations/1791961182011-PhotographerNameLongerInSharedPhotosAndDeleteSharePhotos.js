/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class PhotographerNameLongerInSharedPhotosAndDeleteSharePhotos1791961182011 {
    name = 'PhotographerNameLongerInSharedPhotosAndDeleteSharePhotos1791961182011'

    /**
     * 只放寬 varchar 長度（50 → 255），用 ALTER COLUMN ... TYPE 保留原有資料。
     * TypeORM 自動產生的是 DROP COLUMN + ADD COLUMN ... NOT NULL：有資料的表會因為 NOT NULL 失敗，成功的話原資料也會被丟掉。
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "photographer_name" TYPE character varying(255)`);
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ALTER COLUMN "photographer_name" TYPE character varying(255)`);
    }

    /**
     * 縮回 50 時，若已經有超過 50 字的名字會失敗（寧可失敗也不截斷資料）。
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "deleted_shared_photos" ALTER COLUMN "photographer_name" TYPE character varying(50)`);
        await queryRunner.query(`ALTER TABLE "shared_photos" ALTER COLUMN "photographer_name" TYPE character varying(50)`);
    }
}
