import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import nodemailer  from "nodemailer";
import { prisma } from "../lib/prisma";
import { dayjs } from "../lib/dayjs";
import { getMailClient } from "../lib/mail";
import { ClientError } from "../errors/client-error";
import { env } from "../env";

export async function createInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/invites',
  {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
,     }),
      body: z.object({
        email: z.string().email(),
      })
    }
  },
  async (request) => {
    const { tripId } = request.params
    const { email } = request.body

    const trip = await prisma.trip.findUnique({
      where: { id: tripId }
    })

    if (!trip) {
      throw new ClientError("Trip not found.")
    }

    const participant = await prisma.participant.create({
      data: {
        email,
        trip_id: tripId,
      }
    })

    const formattedStartDate = dayjs(trip.starts_at).format("LL");
    const formattedEndDate = dayjs(trip.ends_at).format("LL");

    const mail = await getMailClient()

    const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`

    const message = await mail.sendMail({
      from: {
        name: 'Plann.er team',
        address: 'assistant@plann.er',
      },
      to: participant.email,
      subject: `Trip confirmation to ${trip.destination} on ${formattedStartDate}`,
      html: `
        <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <p>Your are invited to join in the trip to <strong>${trip.destination}</strong> on the <strong>${formattedStartDate}</strong> to <strong>${formattedEndDate}</strong>.</p>
          <p></p>
          <p>To confirm your trip, click on the link bellow:</p>
          <p></p>
          <p>
            <a href="${confirmationLink}">Accept trip invitation</a>
          </p>
          <p></p>
          <p>Ignore this e-mail in the case you do not know about it.</p>
        </div>
      `.trim()
    })

    console.log(nodemailer.getTestMessageUrl(message))

    return { participantID: participant.id }
  })
}
