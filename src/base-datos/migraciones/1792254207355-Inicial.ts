import { MigrationInterface, QueryRunner } from "typeorm";

export class Inicial1792254207355 implements MigrationInterface {
    name = 'Inicial1792254207355'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "negocio" ("id" integer NOT NULL, "nombre" character varying(100) NOT NULL, "horario" character varying(200) NOT NULL, "domicilio_zona" character varying(100) NOT NULL, "domicilio_costo" integer NOT NULL, "domicilio_tiempo" character varying(50) NOT NULL, CONSTRAINT "PK_e70f1c8b468e32882bff529cb67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "productos" ("id" character varying(40) NOT NULL, "nombre" character varying(100) NOT NULL, "precio" integer NOT NULL, "activo" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_04f604609a0949a7f3b43400766" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."usuarios_rol_enum" AS ENUM('cliente', 'empleado', 'admin')`);
        await queryRunner.query(`CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nombre" character varying(100) NOT NULL, "correo" character varying(150) NOT NULL, "clave_hash" character varying(200) NOT NULL, "rol" "public"."usuarios_rol_enum" NOT NULL DEFAULT 'cliente', "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_63665765c1a778a770c9bd585d3" UNIQUE ("correo"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "usuarios"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_rol_enum"`);
        await queryRunner.query(`DROP TABLE "productos"`);
        await queryRunner.query(`DROP TABLE "negocio"`);
    }

}
