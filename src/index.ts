import express, { Request, Response } from "express";
import axios from "axios";
import fs from "fs";
import { formatClean, parseResponse, truncate } from "./parser";
import amqp from "amqplib/callback_api";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

// Route to accept a query and send the request
app.get("/search", async (req: Request, res: Response) => {
  const query = req.query.q as string;
  const price = req.query.price as string;

  if (!query) {
    return res.status(400).json({ message: "Query parameter 'q' is required" });
  }

  res.status(200).json("OK");

  try {
    const response = await axios.get(`${process.env.BASE}/api_web/v1/listing`, {
      params: {
        sort: "new",
        query: query,
      },
    });

    const parsedRes = parseResponse(response.data);

    const cleanedRes = formatClean(parsedRes);

    amqp.connect(
      `amqp://${process.env.MQ_USR}:${process.env.MQ_PSS}@${process.env.RBT_MQ}`,
      function (error0, connection) {
        if (error0) {
          throw error0;
        }
        connection.createChannel(function (error1, channel) {
          if (error1) {
            throw error1;
          }

          cleanedRes.slice(0, 5).forEach((ad) => {
            // Send to Queue
            channel.sendToQueue(
              `${process.env.QUEUE}`,
              Buffer.from(
                `{"to": "${
                  ad.user
                }", "message": "Hello we are BuyersFirst, and we saw you posted '${truncate(
                  ad.title,
                  45
                )}' on jiji. We have found someone who wants it for ${price} Br. Go to our website www.buyersfirst.et to check it out!"}`
              )
            );
            // Log to file for potential reuse
            fs.appendFile(
              "user.log",
              `${query} -- ${ad.title} -- ${ad.user} -- Br ${ad.price} -- ${ad.category}\n`,
              (err) => {
                if (err) {
                  console.error(err);
                } else {
                  console.log(
                    `${query} -- ${ad.title} -- ${ad.user} -- Br ${ad.price} -- ${ad.category}\n`
                  );
                }
              }
            );
          });
        });
        setTimeout(function () {
          connection.close();
        }, 500);
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching data", error });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
