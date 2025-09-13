// Jest配置文件
module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 根目录
  rootDir: '.',
  
  // 测试文件匹配模式
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // 忽略的测试文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],
  
  // 模块文件扩展名
  moduleFileExtensions: [
    'js',
    'json',
    'node'
  ],
  
  // 模块路径映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // 设置文件
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // 覆盖率配置
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js',
    '!src/server.js',
    '!src/config/**',
    '!src/migrations/**',
    '!src/seeders/**',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // 覆盖率输出目录
  coverageDirectory: 'coverage',
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/controllers/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    './src/middleware/': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    './src/utils/': {
      branches: 65,
      functions: 65,
      lines: 65,
      statements: 65
    }
  },
  
  // 测试超时时间（毫秒）
  testTimeout: 30000,
  
  // 详细输出
  verbose: true,
  
  // 静默模式
  silent: false,
  
  // 错误时停止
  bail: false,
  
  // 最大工作进程数
  maxWorkers: '50%',
  
  // 缓存
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // 清除模拟
  clearMocks: true,
  restoreMocks: true,
  resetMocks: false,
  
  // 全局变量
  globals: {
    'NODE_ENV': 'test'
  },
  
  // 转换配置
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // 忽略转换的模块
  transformIgnorePatterns: [
    '/node_modules/(?!(axios|other-es6-module)/)',
  ],
  
  // 模拟文件映射
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  
  // 报告器配置
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/html-report',
        filename: 'report.html',
        expand: true,
        hideIcon: false,
        pageTitle: 'WeDraw Miniprogram Service Test Report'
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: './coverage',
        outputName: 'junit.xml',
        ancestorSeparator: ' › ',
        uniqueOutputName: 'false',
        suiteNameTemplate: '{filepath}',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}'
      }
    ]
  ],
  
  // 通知配置
  notify: false,
  notifyMode: 'failure-change',
  
  // 监视模式配置
  watchman: true,
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/',
    '/.git/'
  ],
  
  // 快照序列化器
  snapshotSerializers: [],
  
  // 自定义解析器
  resolver: undefined,
  
  // 依赖提取器
  dependencyExtractor: undefined,
  
  // 测试结果处理器
  testResultsProcessor: undefined,
  
  // 运行器
  runner: 'jest-runner',
  
  // 项目配置（多项目支持）
  projects: undefined,
  
  // 强制退出
  forceExit: false,
  
  // 检测打开句柄
  detectOpenHandles: true,
  
  // 检测泄漏
  detectLeaks: false,
  
  // 错误时收集覆盖率
  collectCoverageOnlyFrom: undefined,
  
  // 覆盖率提供者
  coverageProvider: 'v8',
  
  // 自定义环境选项
  testEnvironmentOptions: {},
  
  // 扩展配置
  extensionsToTreatAsEsm: [],
  
  // 预设
  preset: undefined,
  
  // 平台
  platform: undefined,
  
  // 漂亮格式
  prettierPath: 'prettier',
  
  // 运行时忽略模式
  runtimeIgnorePatterns: [],
  
  // 跳过过滤器
  skipFilter: false,
  
  // 慢测试阈值
  slowTestThreshold: 5,
  
  // 快照格式
  snapshotFormat: {
    escapeString: true,
    printBasicPrototype: true
  },
  
  // 测试位置在结果中
  testLocationInResults: false,
  
  // 测试名称模式
  testNamePattern: undefined,
  
  // 更新快照
  updateSnapshot: false,
  
  // 使用stderr
  useStderr: false,
  
  // 监视插件
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // 工作目录
  workerIdleMemoryLimit: '512MB'
};