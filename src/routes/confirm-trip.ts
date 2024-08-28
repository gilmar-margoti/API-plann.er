import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import { dayjs } from "../lib/dayjs";
import nodemailer from "nodemailer";
import { ClientError } from "../errors/client-error";
import { env } from "../env";

export async function confirmTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/trips/:tripId/confirm', {
    schema: {
      params: z.object({
        tripId: z.string().uuid(),
      })
    }
  }, async (request, reply) => {
    const { tripId } = request.params

    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId,
      },
      include: {
        participants: {
          where: {
            is_owner: false,
          }
        }
      }
    })

    if (!trip) {
      throw new ClientError("Trip not found.")
    }

    if (trip.isConfirmed) {
      return reply.redirect(`${env.WEB_BASE_URL}/trips/${tripId}`)
    }

    await prisma.trip.update({
      where: { id: tripId },
      data: { isConfirmed: true },
    })

    const formattedStartDate = dayjs(trip.starts_at).format("LL");
    const formattedEndDate = dayjs(trip.ends_at).format("LL");

    const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm/`

    const mail = await getMailClient()

    await Promise.all(
      trip.participants.map(async (participant) => {
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
      })
    )

    return reply.redirect(`${env.WEB_BASE_URL}/trips/${trip.id}`)
  })
}
