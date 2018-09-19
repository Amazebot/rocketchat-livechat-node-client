import crypto from 'crypto'
import * as sdk from '@rocket.chat/sdk'
import { logger } from './util'

export interface IDepartment {
  _id: string
  enabled: boolean
  name: string
  description: string
  numAgents: number
  showOnRegistration: boolean
  _updatedAt: { $date: number }
}

export interface IInitialData {
  enabled: boolean
  title: string
  color: string
  registrationForm: boolean
  room?: any
  triggers: any[]
  departments: IDepartment[]
  allowSwitchingDepartments: boolean
  online: boolean
  offlineColor: string
  offlineMessage: string
  offlineSuccessMessage: string
  offlineUnavailableMessage: string
  displayOfflineForm: boolean
  videoCall: boolean
  fileUpload: boolean
  conversationFinishedMessage: string
  nameFieldRegistrationForm: boolean
  emailFieldRegistrationForm: boolean
  offlineTitle: string
  language: string
  transcript: boolean
  transcriptMessage: string
}

export interface Ts {
  $date: number
}

export interface IMessageData {
  _id: string
  rid: string
  msg: string
  token: string
  alias: string
  ts: Ts
  u: {
    _id: string
    username: string
  }
  _updatedAt: { $date: number }
  newRoom: boolean
  showConnecting: boolean
}

export interface ILivechatGuest {
  userId: string,
  visitor: {
    name: string,
    token: string,
    username: string,
    visitorEmails: { address: string }[]
  }
}

export interface IMessageHandler {
  (err: Error | null, message: any, meta: any): void
}

/** Manage guests and stream events for a Rocket.Chat livechat department */
export class Livechat {
  driver = sdk.driver
  api = sdk.api
  settings = sdk.settings
  department = process.env.LIVECHAT_DEPARTMENT
  guests: {
    [roomId: string]: {
      guest: ILivechatGuest
      handler: IMessageHandler
    }
  } = {}
  initialData?: IInitialData
  departmentId?: string

  /** Singleton pattern instance */
  private static instance: Livechat

  /** Singleton instance init */
  static getInstance () {
    if (!Livechat.instance) Livechat.instance = new Livechat()
    return Livechat.instance
  }

  /**
   * Create Livechat node client, connects with env settings.
   * Prevent direct access to constructor for singleton adapter.
   */
  private constructor () {
    this.settings.integrationId = 'bBot'
  }

  /**
   * Generate a random unique ID value
   * @param prefix Optionally prepend ID type
   */
  generateId (prefix?: string) {
    const id = crypto.randomBytes(16).toString('hex')
    if (prefix) return `${prefix}_${id}`
    else return id
  }

  /** Connect to Rocket.Chat using env user (roles: livechat-manager + bot) */
  async connect () {
    this.driver.useLog(logger)
    await this.driver.connect()
    await this.driver.login()
    await this.driver.subscribeToMessages()
    await this.driver.respondToMessages(this.handler.bind(this), {
      rooms: [],
      allPublic: true,
      dm: false,
      livechat: true,
      edited: true
    })
    this.initialData = await this.driver.asyncCall('livechat:getInitialData', this.generateId())
    if (this.department) {
      const dept = this.initialData!.departments.find((d) => d.name === this.department)
      if (dept) this.departmentId = dept._id
    }
  }

  /** Receives all message events, routes to registered guest callbacks */
  handler (err: Error | null, message: any, meta: any) {
    if (err) throw err
    if (!(meta.roomType === 'l')) return
    if (Object.keys(this.guests).indexOf(message.rid) > -1) {
      const { guest, handler } = this.guests[message.rid]
      if (message.u._id !== guest.userId) {
        logger.debug(`[livechat] calling handler for ${guest.visitor.name} in ${message.rid}`)
        handler(err, message, meta)
      } else {
        logger.debug(`[livechat] ignoring input from ${guest.visitor.name} in ${message.rid}`)
      }
    }
  }

  /** Create a guest user, returning an ID to use for the livechat room */
  async registerGuest (details: {
    name: string
    email?: string
    token?: string
    department?: string
  }, handler: IMessageHandler) {
    if (!details.token) details.token = this.generateId()
    if (!details.department) details.department = this.departmentId
    const guest: ILivechatGuest = await this.driver.asyncCall('livechat:registerGuest', details)
    const rId = this.generateId()
    logger.info(`[livechat] registered ${details.name} as ${guest.visitor.username}`)
    this.guests[rId] = { guest, handler }
    return rId
  }

  /** Send a message using the given room and corresponding guest details */
  async sendMessage (rid: string, msg: string) {
    const { guest } = this.guests[rid]
    const response: IMessageData = await this.driver.asyncCall('sendMessageLivechat', {
      _id: this.generateId(), rid, msg, token: guest.visitor.token
    })
    return response
  }
}

export const use = () => Livechat.getInstance()
