import Ajv from "ajv";
const ajv = new Ajv();

const materialSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        judul: { type: "string" },
        deskripsi: { type: "string" },
        kode_contoh: { type: "string" },
        output_contoh: { type: "string" },
        level: { type: "string", enum: ["pemula", "menengah", "lanjut"] },
        topik: { type: "array", items: { type: "string" } }
    },
    required: ["id", "judul", "deskripsi", "kode_contoh", "output_contoh", "level", "topik"],
    additionalProperties: false
};

const validate = ajv.compile(materialSchema);

export { validate, materialSchema };
