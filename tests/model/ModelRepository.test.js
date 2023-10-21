require("../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { ModelRepository } = require("../../src/model/ModelRepository.class");

class IncompleteRepository extends ModelRepository
{

}

test("Class misc", () => {
    expect(IncompleteRepository.model).toBeUndefined();
});