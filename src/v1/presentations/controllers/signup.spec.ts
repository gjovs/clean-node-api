
import { type EmailValidator, type AddAccount, type AddAccountSchema, type Account, type HttpRequest } from './sign.up.protocols'
import { MissingParamError, InvalidParamError, ServerError } from '../errors'
import { SignUpController } from './signup.controller'

interface SutTypes {
  sut: SignUpController
  emailValidatorStub: EmailValidator
  addAccountStub: AddAccount
}

const makeFakeRequest = (): HttpRequest => {
  return {
    body: {
      name: 'any_name',
      email: 'invalid_email@gmail.com',
      password: 'any_password',
      passwordConfirmation: 'any_password'
    }
  }
}

const makeEmailValidator = (): EmailValidator => {
  class EmailValidatorStub implements EmailValidator {
    isValid (email: string): boolean {
      return true
    }
  }
  return new EmailValidatorStub()
}

const makeAddAccount = (): AddAccount => {
  class AddAccountStub implements AddAccount {
    async execute (account: AddAccountSchema): Promise<Account> {
      const fakeAccount = {
        id: 'valid_id',
        name: 'valid',
        email: 'valid@gmail.com',
        password: 'valid_password'
      }
      return await new Promise(resolve => { resolve(fakeAccount) })
    }
  }

  return new AddAccountStub()
}

const makeSut = (): SutTypes => {
  const addAccountStub = makeAddAccount()
  const emailValidatorStub = makeEmailValidator()
  return {
    sut: new SignUpController(emailValidatorStub, addAccountStub),
    emailValidatorStub,
    addAccountStub
  }
}

describe('test the signup controller', () => {
  it('should return 400 if no name is provided', async () => {
    // sut = System under test
    const { sut } = makeSut()
    const fakeRequestBody = makeFakeRequest().body

    delete fakeRequestBody.name

    const httpRequest = { body: { ...fakeRequestBody } }

    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('name'))
  })

  it('should return 400 if no email is provided', async () => {
    // sut = System under test
    const { sut, emailValidatorStub } = makeSut()
    jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false)

    const fake = makeFakeRequest().body

    const httpRequest = { body: { ...fake, email: '' } }

    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('email'))
  })

  it('should return 400 if no password is provided', async () => {
    const { sut } = makeSut()
    const fakeRequestBody = makeFakeRequest().body

    delete fakeRequestBody.password

    const httpRequest = { body: { ...fakeRequestBody } }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('password'))
  })

  it('should return 400 if no password confirmation is provided', async () => {
    const { sut } = makeSut()
    const fakeRequestBody = makeFakeRequest().body

    delete fakeRequestBody.passwordConfirmation

    const httpRequest = { body: { ...fakeRequestBody } }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('passwordConfirmation'))
  })

  it('should return 400 if passwordConfirmation fails', async () => {
    const { sut } = makeSut()
    const fakeRequest = makeFakeRequest().body
    const httpRequest = { body: { ...fakeRequest, passwordConfirmation: '123' } }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new InvalidParamError('passwordConfirmation'))
  })

  it('should call EmailValidator with correct email', async () => {
    const { emailValidatorStub, sut } = makeSut()
    const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid')

    const httpRequest = makeFakeRequest()

    await sut.handle(httpRequest)

    expect(isValidSpy).toHaveBeenCalledWith('invalid_email@gmail.com')
  })

  it('should returns 500 if EmailValidator throws', async () => {
    const { sut, emailValidatorStub } = makeSut()

    const fakeError = new Error()
    fakeError.stack = 'any'

    jest.spyOn(emailValidatorStub, 'isValid').mockImplementation(() => {
      throw fakeError
    })

    const httpRequest = makeFakeRequest()

    const httpResponse = await sut.handle(httpRequest)

    console.error(httpResponse)

    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError('any'))
  })

  it('should call AddAccount with correct fields', async () => {
    const { sut } = makeSut()

    const executeSpy = jest.spyOn(sut.addAccount, 'execute')

    const httpRequest = makeFakeRequest()

    await sut.handle(httpRequest)

    expect(executeSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: httpRequest.body.name,
        email: httpRequest.body.email,
        password: httpRequest.body.password
      })
    )
  })

  it('should returns 500 if AddAccount throws', async () => {
    const { sut, addAccountStub } = makeSut()

    const fakeError = new Error()
    fakeError.stack = 'any'

    jest.spyOn(addAccountStub, 'execute').mockImplementation(async () => {
      return await new Promise((resolve, reject) => { reject(fakeError) })
    })

    const httpRequest = makeFakeRequest()

    const httpResponse = await sut.handle(httpRequest)

    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError('any'))
  })

  it('should returns 200 if valid data is provided', async () => {
    const { sut } = makeSut()

    const httpRequest = makeFakeRequest()

    const httpResponse = await sut.handle(httpRequest)

    expect(httpResponse.body).toEqual({
      id: 'valid_id',
      name: 'valid',
      email: 'valid@gmail.com',
      password: 'valid_password'
    })
  })
})
