import { compare } from "../schema-comparision";
import { parseSchema, TypeInfo } from "..";
import { VersionRelease } from "../schema-comparision/comparers";

const schemas_1: string[] = [
  `
  type Vehicle {
    price: Int
    model: String!
    brand: String
  }
  `,
  `
  type Vehicle {
    price: Int
    hasFourWheel: Boolean
    model: String!
    brand: String
  }
  `,
];

const schemas_2: string[] = [
  `
  type Vehicle {
    price: Int  # price of the vehicle
    model: String!
    brand: String
  }

  enum VehicleType {
    CAR,
    TRUCK,
    BUS
  }
  `,
  `
  type Vehicle {
    """ 
    Vehicle type reordered
    """
    brand: String
    hasFourWheel: Boolean
    price: Int  # price of the vehicle in ETH
    model: String!  # model of the vehicle
  }

  enum VehicleType {
    """
    reordered and more types
    """
    BUS,
    CAR,
    TRUCK,
    SCOOTER,
    BIKE
  }
  `,
];

const schemas_3: string[] = [
  `
  scalar Int
  scalar Int8
  scalar Int16
  scalar Int32
  scalar Bytes
  scalar BigInt
  
  directive @imported(
    namespace: String!
    nativeType: String!
    uri: String!
  ) on OBJECT | ENUM
  
  directive @imports(
      types: [String!]!
  ) on OBJECT
  
  type Interface_Query @imported(
    uri: "interface.uri.eth",
    namespace: "Interface",
    nativeType: "Query"
  ) {
    abstractMethod(
      arg: UInt8!
    ): String!
  }
  
  type TestImport_Query @imported(
    uri: "testimport.uri.eth",
    namespace: "TestImport",
    nativeType: "Query"
  ) {
    importedMethod(
      u: UInt!
      optU: UInt
      str: String!
      optStr: String
      uArrayArray: [[UInt]]!
    ): String!
  }
  
  type Query implements Interface_Query @imports(
    types: [ "TestImport_Query", "Interface_Query" ]
  ) {
    queryMethod(
      arg: String!
    ): [Int]!
  }
  `,
  `
  scalar Int
  scalar Int8
  scalar Int16
  scalar Int32
  scalar Bytes
  scalar BigInt
  
  directive @imported(
    uri: String!
    namespace: String!
    nativeType: String!
  ) on OBJECT | ENUM
  
  directive @imports(
      types: [String!]!
  ) on OBJECT
  
  type Interface_Query @imported(
    uri: "interface.uri.eth",
    namespace: "Interface",
    nativeType: "Query"
  ) {
    abstractMethod(
      arg: UInt8!
    ): String!
  }
  
  type TestImport_Query @imported(
    uri: "testimport.uri.eth",
    namespace: "TestImport",
    nativeType: "Query"
  ) {
    importedMethod(
      u: UInt!
      optU: UInt
      optI: Int
      str: String!
      optStr: String
      uArrayArray: [[UInt]]!
    ): String!
  }
  
  type Query implements Interface_Query @imports(
    types: [ "TestImport_Query", "Interface_Query" ]
  ) {
    queryMethod(
      arg: String!
      name: String
    ): [Int]!
  }
  `,
];

describe("MINOR version release comparision", () => {
  it("more optional fields in type", () => {
    // Exactly equal schemas
    const t1: TypeInfo = parseSchema(schemas_1[0]);
    const t2: TypeInfo = parseSchema(schemas_1[1]);

    expect(compare(t1, t2)).toBe(VersionRelease.MINOR);
  });

  it("more fields in enums and types", () => {
    const t1: TypeInfo = parseSchema(schemas_2[0]);
    const t2: TypeInfo = parseSchema(schemas_2[1]);

    expect(compare(t1, t2)).toBe(VersionRelease.MINOR);
  });

  it("more fields in schema with imports and queries", () => {
    const t1: TypeInfo = parseSchema(schemas_3[0]);
    const t2: TypeInfo = parseSchema(schemas_3[1]);

    expect(compare(t1, t2)).toBe(VersionRelease.MINOR);
  });
});
