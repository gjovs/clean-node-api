
import { type Collection } from 'mongodb'
import { MongoHelper } from '../helpers/mongo.helper'
import { LogErrorMongoRepository } from './log-error'

interface SutTypes {
  sut: LogErrorMongoRepository
}

describe('LogError MongoDB Repository', () => {
  let errorsCollection: Collection

  beforeAll(async () => { await MongoHelper.connect(process.env.MONGO_URL) })

  afterAll(async () => { await MongoHelper.disconnect() })

  beforeEach(async () => {
    errorsCollection = await MongoHelper.getCollection('errors')
    await errorsCollection.deleteMany({})
  })

  const makeSut = (): SutTypes => {
    const logErrorRepository = new LogErrorMongoRepository()
    return {
      sut: logErrorRepository
    }
  }

  it('should create an error on success', async () => {
    const { sut } = makeSut()

    await sut.log('any_error')

    const count = await errorsCollection.countDocuments({})

    expect(count).toBe(1)
  })
})
