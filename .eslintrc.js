module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
  },
  extends: [

  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    "arrow-body-style": 2,
    "semi": ["error", "always"],
    "quotes": ["error", "double"],
    "prefer-const": 1
  }
};
