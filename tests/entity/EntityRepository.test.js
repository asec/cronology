require("../../config/dotenv").environment("test");
const { test, expect } = require("@jest/globals");
const { EntityRepository } = require("../../src/model/EntityRepository.class");

class IncompleteRepository extends EntityRepository
{

}

test("Class misc", () => {
    expect(IncompleteRepository.model).toBeUndefined();
});