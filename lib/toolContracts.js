import {
  buildInstallSteps,
  checkCompatibility,
  getPartDetails,
  retrieveDocs,
  searchParts
} from "./tools";

const TOOL_REGISTRY = {
  search_parts: {
    description: "Search part catalog by symptom, number, or keyword.",
    auth: {
      required: false,
      level: "public"
    },
    latencyBudgetMs: 250,
    inputSchema: {
      type: "object",
      required: ["query", "applianceType"],
      additionalProperties: false,
      properties: {
        query: { type: "string", minLength: 1 },
        applianceType: { type: "string", enum: ["refrigerator", "dishwasher"] }
      }
    },
    outputSchema: {
      type: "array",
      items: {
        type: "object",
        required: [
          "id",
          "psNumber",
          "partNumber",
          "name",
          "applianceType",
          "manufacturer",
          "replaces",
          "symptoms",
          "price",
          "inStock",
          "shippingEta"
        ],
        properties: {
          id: { type: "string" },
          psNumber: { type: "string" },
          partNumber: { type: "string" },
          name: { type: "string" },
          applianceType: { type: "string", enum: ["refrigerator", "dishwasher"] },
          manufacturer: { type: "string" },
          replaces: { type: "array", items: { type: "string" } },
          symptoms: { type: "array", items: { type: "string" } },
          price: { type: "number" },
          inStock: { type: "boolean" },
          shippingEta: { type: "string" }
        }
      }
    },
    fallback: {
      strategy: "empty",
      value: []
    },
    handler: ({ query, applianceType }) => searchParts({ query, applianceType })
  },
  get_part_details: {
    description: "Fetch a single part by PS number.",
    auth: {
      required: false,
      level: "public"
    },
    latencyBudgetMs: 200,
    inputSchema: {
      type: "object",
      required: ["psNumber"],
      additionalProperties: false,
      properties: {
        psNumber: { type: "string", pattern: "^PS\\d{6,}$" }
      }
    },
    outputSchema: {
      type: "object",
      nullable: true,
      properties: {
        id: { type: "string" },
        psNumber: { type: "string" },
        partNumber: { type: "string" },
        name: { type: "string" },
        applianceType: { type: "string" },
        manufacturer: { type: "string" },
        replaces: { type: "array", items: { type: "string" } },
        symptoms: { type: "array", items: { type: "string" } },
        price: { type: "number" },
        inStock: { type: "boolean" },
        shippingEta: { type: "string" }
      }
    },
    fallback: {
      strategy: "null",
      value: null
    },
    handler: ({ psNumber }) => getPartDetails(psNumber)
  },
  check_compatibility: {
    description: "Check part-model compatibility confidence.",
    auth: {
      required: false,
      level: "public"
    },
    latencyBudgetMs: 300,
    inputSchema: {
      type: "object",
      required: ["modelNumber", "psNumber"],
      additionalProperties: false,
      properties: {
        modelNumber: { type: "string", minLength: 6 },
        psNumber: { type: "string", pattern: "^PS\\d{6,}$" }
      }
    },
    outputSchema: {
      type: "object",
      required: ["compatible", "fitConfidence", "notes"],
      properties: {
        compatible: { type: "boolean" },
        fitConfidence: { type: "string", enum: ["high", "medium", "low"] },
        notes: { type: "string" }
      }
    },
    fallback: {
      strategy: "static",
      value: {
        compatible: false,
        fitConfidence: "low",
        notes: "Compatibility service unavailable. Confirm fit manually with model and serial."
      }
    },
    handler: ({ modelNumber, psNumber }) => checkCompatibility({ modelNumber, psNumber })
  },
  retrieve_docs: {
    description: "Retrieve troubleshooting or install snippets for citations.",
    auth: {
      required: false,
      level: "public"
    },
    latencyBudgetMs: 450,
    inputSchema: {
      type: "object",
      required: ["query", "applianceType"],
      additionalProperties: false,
      properties: {
        query: { type: "string", minLength: 1 },
        applianceType: { type: "string", enum: ["refrigerator", "dishwasher"] },
        psNumber: { type: "string" }
      }
    },
    outputSchema: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "url", "docType", "content", "updatedAt"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          url: { type: "string" },
          docType: { type: "string" },
          content: { type: "string" },
          updatedAt: { type: "string" }
        }
      }
    },
    fallback: {
      strategy: "empty",
      value: []
    },
    handler: ({ query, applianceType, psNumber }) => retrieveDocs({ query, applianceType, psNumber })
  },
  build_install_steps: {
    description: "Build ordered installation checklist for a part.",
    auth: {
      required: false,
      level: "public"
    },
    latencyBudgetMs: 250,
    inputSchema: {
      type: "object",
      required: ["psNumber"],
      additionalProperties: false,
      properties: {
        psNumber: { type: "string", pattern: "^PS\\d{6,}$" }
      }
    },
    outputSchema: {
      type: "array",
      items: { type: "string" }
    },
    fallback: {
      strategy: "empty",
      value: []
    },
    handler: ({ psNumber }) => buildInstallSteps({ psNumber })
  },
  order_lookup: {
    description: "Retrieve order status by order number and postal code.",
    auth: {
      required: true,
      level: "customer_session"
    },
    latencyBudgetMs: 1200,
    inputSchema: {
      type: "object",
      required: ["orderId", "postalCode"],
      additionalProperties: false,
      properties: {
        orderId: { type: "string", minLength: 3 },
        postalCode: { type: "string", minLength: 3 }
      }
    },
    outputSchema: {
      type: "object",
      required: ["status", "message"],
      properties: {
        status: { type: "string" },
        message: { type: "string" }
      }
    },
    fallback: {
      strategy: "static",
      value: {
        status: "unavailable",
        message: "Order service unavailable. Use secure form retry or customer support."
      }
    },
    handler: () => {
      throw new Error("Order tool handler must be implemented in authenticated backend.");
    }
  }
};

function validateAgainstSchema(value, schema, path = "$") {
  const errors = [];

  if (!schema) return errors;
  if (schema.nullable && value === null) return errors;

  if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      errors.push(`${path} must be an object.`);
      return errors;
    }

    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in value)) errors.push(`${path}.${key} is required.`);
      }
    }

    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(value)) {
        if (!schema.properties[key]) errors.push(`${path}.${key} is not allowed.`);
      }
    }

    if (schema.properties) {
      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        if (key in value) {
          errors.push(...validateAgainstSchema(value[key], propertySchema, `${path}.${key}`));
        }
      }
    }
  }

  if (schema.type === "array") {
    if (!Array.isArray(value)) {
      errors.push(`${path} must be an array.`);
      return errors;
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validateAgainstSchema(item, schema.items, `${path}[${index}]`));
      });
    }
  }

  if (schema.type === "string") {
    if (typeof value !== "string") errors.push(`${path} must be a string.`);
    if (typeof schema.minLength === "number" && typeof value === "string" && value.length < schema.minLength) {
      errors.push(`${path} must be at least ${schema.minLength} chars.`);
    }
    if (schema.enum && !schema.enum.includes(value)) errors.push(`${path} must be one of: ${schema.enum.join(", ")}.`);
    if (schema.pattern && typeof value === "string" && !new RegExp(schema.pattern).test(value)) {
      errors.push(`${path} does not match expected pattern.`);
    }
  }

  if (schema.type === "number" && typeof value !== "number") errors.push(`${path} must be a number.`);
  if (schema.type === "boolean" && typeof value !== "boolean") errors.push(`${path} must be a boolean.`);

  return errors;
}

function timeoutAfter(ms, toolName) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Tool ${toolName} exceeded latency budget of ${ms}ms.`)), ms);
  });
}

function getFallback(contract, reason) {
  if (!contract?.fallback) return { status: "error", data: null, error: reason };
  return {
    status: "fallback",
    data: contract.fallback.value,
    error: reason
  };
}

export async function runTool(toolName, input, options = {}) {
  const contract = TOOL_REGISTRY[toolName];
  if (!contract) {
    return {
      toolName,
      status: "error",
      data: null,
      error: `Unknown tool: ${toolName}.`,
      contract: null
    };
  }

  const authContext = options.authContext || { isAuthenticated: false };
  if (contract.auth.required && !authContext.isAuthenticated) {
    const denied = getFallback(contract, "Authentication required for this tool.");
    return {
      toolName,
      ...denied,
      contract: {
        auth: contract.auth,
        latencyBudgetMs: contract.latencyBudgetMs
      }
    };
  }

  const inputErrors = validateAgainstSchema(input, contract.inputSchema);
  if (inputErrors.length) {
    const invalidInput = getFallback(contract, `Input contract failed: ${inputErrors.join(" ")}`);
    return {
      toolName,
      ...invalidInput,
      contract: {
        auth: contract.auth,
        latencyBudgetMs: contract.latencyBudgetMs
      }
    };
  }

  try {
    const data = await Promise.race([
      Promise.resolve(contract.handler(input)),
      timeoutAfter(contract.latencyBudgetMs, toolName)
    ]);

    const outputErrors = validateAgainstSchema(data, contract.outputSchema);
    if (outputErrors.length) {
      const invalidOutput = getFallback(contract, `Output contract failed: ${outputErrors.join(" ")}`);
      return {
        toolName,
        ...invalidOutput,
        contract: {
          auth: contract.auth,
          latencyBudgetMs: contract.latencyBudgetMs
        }
      };
    }

    return {
      toolName,
      status: "success",
      data,
      error: null,
      contract: {
        auth: contract.auth,
        latencyBudgetMs: contract.latencyBudgetMs
      }
    };
  } catch (error) {
    const executionFailure = getFallback(contract, error?.message || "Tool execution failed.");
    return {
      toolName,
      ...executionFailure,
      contract: {
        auth: contract.auth,
        latencyBudgetMs: contract.latencyBudgetMs
      }
    };
  }
}

export function listToolContracts() {
  return Object.entries(TOOL_REGISTRY).map(([name, contract]) => ({
    name,
    description: contract.description,
    auth: contract.auth,
    latencyBudgetMs: contract.latencyBudgetMs,
    inputSchema: contract.inputSchema,
    outputSchema: contract.outputSchema,
    fallback: contract.fallback
  }));
}
