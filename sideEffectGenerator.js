const fs = require('fs')
const prompt = require('prompt')
const writers = require('./writers')

prompt.start()

const cliPrompt = [
  { name: 'name', type: 'string', description: 'please enter the model name' },
  {
    name: 'pluralName',
    type: 'string',
    description: 'enter custom plural name if needed'
  },
  {
    name: 'fields',
    type: 'string',
    description: 'enter fields: (name:string,age:number...)'
  },
  {
    name: 'isGlobal',
    type: 'boolean',
    description: 'is the model has global effects? (true or false)'
  }
]

prompt.get(cliPrompt, (err, result) => {
  if (err) console.log('can not read the input', err)
  handleModelCreation(result.name, result.pluralName, result.fields, result.isGlobal)
})

const parseFields = fieldsString =>
  fieldsString.split(',').map(fieldString => {
    const [name, type] = fieldString.split(':')
    return { name, type }
  })

function handleModelCreation(modelName, pluralName, fields, isGlobalModel) {
  fields = parseFields(fields)
  const sideEffects = generateModelSideEffects(modelName)

  const mobxStore = generateMobxStoreForModel(modelName, fields)

  const globalSideEffects = isGlobalModel
    ? generateGlobalActions(modelName, pluralName)
    : null

  writers.writeSideEffects(sideEffects)
  writers.writeMobxStore(mobxStore)
  writers.writeGolbalActions(globalSideEffects)
}

function generateModelSideEffects(modelName) {
  if (!modelName) {
    throw new Error('modelName is required')
  }

  modelName = modelName.toLowerCase()

  const capModelName = capitalFirstLetter(modelName)

  const imports = `
import * as api from '../network/api'
import { The } from '../network/helpers'
import { createFormData } from '../utility/helpers'`

  const methods = `

export const getAll${capModelName}s = async params =>
  await The(api.getAll${capModelName}s(params))

export const get${capModelName} = async ${modelName}Slug =>
  await The(api.get${capModelName}(${modelName}Slug))

export const addNew${capModelName} = async formValues =>
  await The(api.addNew${capModelName}(createFormData(formValues)))

export const edit${capModelName} = async (${modelName}Slug, formValues) =>
  await The(api.edit${capModelName}(${modelName}Slug, createFormData(formValues)))

export const remove${capModelName} = async ${modelName}Slug =>
  await The(api.${capModelName}(${modelName}Slug))
`

  return imports + methods
}

function generateGlobalActions(modelName, pluralName) {
  if (!modelName) {
    throw new Error('modelName is required')
  }

  modelName = modelName.toLowerCase()
  const capModelName = capitalFirstLetter(modelName)
  const modelPluralName = pluralName || capModelName + 's'
  const capModePluralName = capitalFirstLetter(modelPluralName)

  const sideEffectName = `get${capModePluralName}`
  const storeName = `${capModelName}Store`

  const imports = `
import UserNotifier from '../notifications/Notifications';
import { ${sideEffectName} } from '../sideEffects/${modelName}Effects';
import ${storeName} from '../stores/${storeName}';
import { awaitSideEffect } from '../utility/helpers';
`

  const methods = `
export const get${capModePluralName}Global = (params): void => {
  awaitSideEffect({
    sideEffect: ${sideEffectName}(params),
    onStart: ${storeName}.startLoading,
    onEnd: ${storeName}.endLoading,
    onSuccess: ({ ${modelPluralName} }) => ${storeName}.set${modelPluralName}List(${modelPluralName}),
    onFailGeneralErrors: UserNotifier.withError
  })
}
`
  return imports + methods
}

function generateMobxStoreForModel(modelName, fields) {
  if (!modelName) {
    throw new Error('modelName is required')
  }

  modelName = modelName.toLowerCase()

  const capModelName = capitalFirstLetter(modelName)

  return `
import { observable, action } from 'mobx'
import autobind from 'autobind-decorator'

export interface I${capModelName} {
  ${fields.map(({ name, type }) => `${name}: ${type}`).join(', \n\t')}
}

@autobind
export class ${capModelName}Store {
  @observable ${modelName}s: I${capModelName}[] = []
  @observable isLoading: boolean = false

  @action
  setStores = (${modelName}s: I${capModelName}[]) => {
    this.${modelName}s = ${modelName}s
  }

  @action
  startLoading() {
    this.isLoading = true
  }

  @action
  endLoading() {
    this.isLoading = false
  }
}

export default new ${capModelName}Store()
`
}

function capitalFirstLetter(string) {
  return string.substring(0, 1).toUpperCase() + string.substring(1, string.length)
}
