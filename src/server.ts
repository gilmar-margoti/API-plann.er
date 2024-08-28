import fastify from "fastify";
import cors from "@fastify/cors";
import { createTrip } from "./routes/create-trip";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { confirmTrip } from "./routes/confirm-trip";
import { confirmParticipant } from "./routes/confirm-participant";
import { createActivity } from "./routes/create-activity";
import { getActivity } from "./routes/get-activities";
import { createLink } from "./routes/create-link";
import { getLink } from "./routes/get-links";
import { getParticipants } from "./routes/get-participants";
import { createInvite } from "./routes/create-invite";
import { updateTrip } from "./routes/update-trip";
import { errorHandler } from "./error-handler";
import { getTripDetails } from "./routes/get-trip-details";
import { getParticipant } from "./routes/get-participant";
import { env } from "./env";

const app = fastify()

app.register(cors, {
  origin: '*',
})

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.setErrorHandler(errorHandler)

app.register(createTrip)
app.register(confirmTrip)
app.register(confirmParticipant)
app.register(createActivity)
app.register(getActivity)
app.register(createLink)
app.register(getLink)
app.register(getParticipants)
app.register(createInvite)
app.register(getTripDetails)
app.register(updateTrip)
app.register(getParticipant)

app.listen({ port: env.PORT }).then(() => {
  console.log("Server running!")
})
