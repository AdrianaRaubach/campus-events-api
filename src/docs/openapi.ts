export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Campus Events API',
    version: '0.0.1',
    description:
      'API REST para gerenciar eventos acadêmicos de um campus. Atualmente expõe o recurso **people** e os endpoints de health check.',
  },
  servers: [{ url: '/', description: 'Servidor atual' }],
  tags: [
    { name: 'Health', description: 'Verificação de status da API e do banco de dados' },
    { name: 'People', description: 'Cadastro e consulta de pessoas' },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Status da API',
        responses: {
          '200': {
            description: 'API em funcionamento',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Health' } },
            },
          },
        },
      },
    },
    '/health/deep': {
      get: {
        tags: ['Health'],
        summary: 'Status da API e da conexão com o banco',
        responses: {
          '200': {
            description: 'API e banco de dados em funcionamento',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Health' } },
            },
          },
          '503': {
            description: 'Banco de dados indisponível',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { status: 503, message: 'Service unavailable', name: 'HttpError' },
              },
            },
          },
        },
      },
    },
    '/people': {
      get: {
        tags: ['People'],
        summary: 'Lista todas as pessoas',
        responses: {
          '200': {
            description: 'Lista de pessoas (vazia se não houver registros)',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Person' } },
              },
            },
          },
        },
      },
      post: {
        tags: ['People'],
        summary: 'Cadastra uma pessoa',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NewPerson' },
              example: { name: 'Adriana', age: 31 },
            },
          },
        },
        responses: {
          '200': {
            description: 'Pessoa cadastrada (o `id` é gerado pelo banco)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Person' } },
            },
          },
          '400': {
            description: 'Corpo da requisição inválido',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { status: 400, message: 'Invalid request', name: 'ZodError' },
              },
            },
          },
        },
      },
    },
    '/people/{id}': {
      get: {
        tags: ['People'],
        summary: 'Busca uma pessoa pelo id',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Id da pessoa',
            schema: { type: 'integer', minimum: 1 },
            example: 1,
          },
        ],
        responses: {
          '200': {
            description: 'Pessoa encontrada',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Person' } },
            },
          },
          '400': {
            description: 'Id inválido (não é um inteiro positivo)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { status: 400, message: 'Invalid request', name: 'ZodError' },
              },
            },
          },
          '404': {
            description: 'Pessoa não encontrada',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
                example: { status: 404, message: 'Person not found', name: 'HttpError' },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Health: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'healthy' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      NewPerson: {
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string', minLength: 1, example: 'Adriana' },
          age: { type: 'integer', exclusiveMinimum: 0, maximum: 150, example: 31 },
        },
      },
      Person: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Adriana' },
          age: { type: 'integer', example: 31 },
        },
      },
      Error: {
        type: 'object',
        properties: {
          status: { type: 'integer', example: 400 },
          message: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};
