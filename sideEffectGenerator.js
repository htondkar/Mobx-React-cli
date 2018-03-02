const fs = require('fs')
const prompt = require('prompt')

prompt.start()

const cliPrompt = [
  { name: 'name', type: 'string', description: 'please enter the model name' },
  {
    name: 'isGlobal',
    type: 'boolean',
    description: 'is the model has global effects? (true or false)'
  }
]

prompt.get(cliPrompt, (err, result) => {
  if (err) console.log('can not read the input', err)
  handleModelCreation(result.name, result.isGlobal)
})

function handleModelCreation(modelName, isGlobalModel) {
  const sideEffetcts = generateModelSideEffects(modelName)
  const mobxStore = generateMobxStoreForModel(modelName)

  console.log(sideEffetcts)
  console.log(mobxStore)
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

function generateMobxStoreForModel(modelName) {
  if (!modelName) {
    throw new Error('modelName is required')
  }

  modelName = modelName.toLowerCase()

  const capModelName = capitalFirstLetter(modelName)

  return `
import { observable, action } from 'mobx'
import autobind from 'autobind-decorator'

export interface I${capModelName} {
  // TODO: this should come from input
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
  return (
    string.substring(0, 1).toUpperCase() + string.substring(1, string.length)
  )
}
