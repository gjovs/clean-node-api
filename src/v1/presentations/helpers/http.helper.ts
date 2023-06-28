import { ServerError } from '../errors'
import { type HttpResponse } from '../protocols'

export const badRequest = (error: Error): HttpResponse => ({
  statusCode: 400,
  body: error
})

export const serverError = (): HttpResponse => ({
  statusCode: 500,
  body: new ServerError()
})

export const successRequest = (body: any): HttpResponse => ({
  statusCode: 200,
  body
})