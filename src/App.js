const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const fs = require("fs");
// const expressLayouts = require('express-ejs-layouts');
// const path = require("path");
const port = process.env.PORT || 3001;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// app.use(expressLayouts);
// app.use(express.static(path.join)(__dirname, 'public'));
dotenv.config()


app.set('view engine', 'ejs');

//  https://www.techiediaries.com/postgresql-connection-pool-client-example/
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT
});

const connectDb = async (query) => {
  try {
    const res = await pool.query(query);
    return res;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

process.on('exit', () => {
  pool.end();
  console.log('Connection closed');
});
// https://www.techiediaries.com/postgresql-connection-pool-client-example/


const insertTransction = async (type, id_transaction, bank_origin, account_origin, bank_destiny, account_destiny, amount, date) => {
  const query = `INSERT INTO transactions (type, id_transaccion, bank_origin, account_origin, 
                  bank_destiny, account_destiny, amount, date) 
                  VALUES ('${type}', '${id_transaction}', '${bank_origin}', '${account_origin}', 
                  '${bank_destiny}', '${account_destiny}', '${amount}', '${date}')`;

  const response = await connectDb(query);
  return response;}

const findQuery = async (query) => {
  const response = await connectDb(query);
  return response;
}

const manageDate = (date) => {
  const myArray = date.split("T");
  let word = myArray[0];
  return word;
}

const removeZeros = (data) => {
  const strippedValue = parseInt(data.toString(), 10);
  return strippedValue;
}

app.post("/", (req, res) => {
  console.log("Received a request");
  const message = req.body.message;
  const info = Buffer.from(message.data).toString('base64');
  const type = info.slice(0, 4);
  const id = info.slice(4, 14);
  const origin_bank = removeZeros(info.slice(14, 21));
  const account_origin = removeZeros(info.slice(21, 31));
  const destination_bank = removeZeros(info.slice(31, 38));
  const account_destination = removeZeros(info.slice(38, 48));
  const amount = removeZeros(info.slice(48, 64));
  const date = manageDate(message.publishTime);
  

  insertTransction(type, id, origin_bank, account_origin, destination_bank, account_destination, amount, date).then(result => {
    if (result) {
        console.log('Data insert successful');
    }

  res.sendStatus(200);
  })}
);


app.get('/', (req, res) => {

  var count;
  var op1;
  var op2;
  var num_op1;
  var num_op2;
  var amount_op1;
  var amount_op2;
  var transactions;
  var dates;
  var bank_origin;
  var bank_destiny;
  const final_dict = {};

//   // number of transactions
  const getInfo = async () => {
    await connectDb(`SELECT COUNT(*) FROM transactions;`).then(result => {
      // console.log("count")
      // console.log(result.rows[0].count);
      count = result.rows[0].count;});

    await connectDb(`SELECT type, COUNT(*), SUM(amount) FROM transactions GROUP BY type;`).then(result => {
      // console.log("order by type")
      op1 = result.rows[0].type;
      op2 = result.rows[1].type;
      num_op1 = result.rows[0].count;
      num_op2 = result.rows[1].count;
      amount_op1 = result.rows[0].sum;
      amount_op2 = result.rows[1].sum;
    });

    await connectDb(`SELECT * FROM transactions ORDER BY date DESC LIMIT 100;`).then(result => {
      console.log("last 100 transactions")
      console.log(result.rows);
      transactions = result.rows;});

    await connectDb(`SELECT date FROM transactions GROUP BY date;`).then(result => {
      console.log("dates")
      console.log(result.rows);
      dates = result.rows;});

    await connectDb(`SELECT bank_origin FROM transactions GROUP BY bank_origin;`).then(result => {
      console.log("bank origin")
      console.log(result.rows);
      bank_origin = result.rows;});
    
    await connectDb(`SELECT bank_destiny FROM transactions GROUP BY bank_destiny;`).then(result => {
      console.log("bank destiny")
      console.log(result.rows);
      bank_destiny = result.rows;});

      // try {
      //   const dict_origin = await connectDb('SELECT bank_origin FROM transactions GROUP BY bank_origin;');
      //   const dict_destiny = await connectDb('SELECT bank_destiny FROM transactions GROUP BY bank_destiny;');
    
      //   const pairs = [];
    
      //   for (const origin of dict_origin.rows) {
      //     for (const destiny of dict_destiny.rows) {
      //       const join = origin.bank_origin + destiny.bank_destiny;
      //       const check = Number(join);
      //       if (!pairs.includes(check) && origin.bank_origin !== destiny.bank_destiny) {
      //         const org_to_dest = await connectDb(`SELECT SUM(amount) FROM transactions WHERE bank_origin = '${origin.bank_origin}' AND bank_destiny = '${destiny.bank_destiny}';`);
      //         const dest_to_org = await connectDb(`SELECT SUM(amount) FROM transactions WHERE bank_origin = '${destiny.bank_destiny}' AND bank_destiny = '${origin.bank_origin}';`);
      //         const final = org_to_dest.rows[0].sum - dest_to_org.rows[0].sum;
      //         const num = origin.bank_origin + destiny.bank_destiny;
      //         const new_num = Number(num);
    
      //         pairs.push(new_num);
      //         if (final >= 0) {
      //           final_dict[`El banco ${origin.bank_origin} le debe al banco ${destiny.bank_destiny}`] = final;
      //         } else if (final < 0) {
      //           final_dict[`El banco ${destiny.bank_destiny} le debe al banco ${origin.bank_origin}`] = -final;
      //         }
      //       }
      //     }
      //   }
      // } catch (error) {
      //   console.error(error);
      //   res.status(500).send('Internal Server Error');
      // }

    const username = 'John lol';
    const email = 'johndoe@example.com';

    // borre final_dict from render

    res.render('dashboard', { username, email, count, op1, op2, num_op1, num_op2, amount_op1, amount_op2, transactions, dates, bank_origin, bank_destiny });
    return 1;


  }
  async function getResponse () {
    getInfo().then(response => {
      console.log("aca2");
      console.log(response)
      return response;
    });
}

  const PORFAVOR = getResponse()

});

app.post('/charts', (req, res) => {
  console.log("entro a charts");
  console.log(req.body);
  console.log(req.body.param1.length);
  var type;
  var variable;
  if (typeof req.body.param1 === 'string') {
    console.log("entro a charts 1")
    type = req.body.param1;
    variable = req.body.param2;
  } else {
    console.log("entro a charts 2")
    type = req.body.param1.slice(-1);
    variable = req.body.param2.slice(-1);
  }
  if (type == 'date') {
    const date = new Date(variable);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    variable = `${year}-${month}-${day}`;
  }

  console.log(type);
  console.log(variable);

  var int_1;
  var int_2;
  var int_3;
  var int_4;
  var int_5;
  var int_6;
  var int_7;

  const getInfo = async () => {
    await connectDb(`SELECT COUNT(*), SUM(amount) FROM transactions WHERE amount < 10000 AND ${type}='${variable}';`).then(result => {
      int_1 = result.rows[0].count;});

    await connectDb(`SELECT COUNT(*), SUM(amount) FROM transactions WHERE amount > 10000 AND amount < 49999 AND ${type}='${variable}';`).then(result => {
      int_2 = result.rows[0].count;});

    await connectDb(`SELECT COUNT(*), SUM(amount) FROM transactions WHERE amount > 50009 AND amount < 99999 AND ${type}='${variable}';`).then(result => {
      int_3 = result.rows[0].count;});

    await connectDb(`SELECT COUNT(*), SUM(amount) FROM transactions WHERE amount > 100000 AND amount < 499999 AND ${type}='${variable}';`).then(result => {
      int_4 = result.rows[0].count;});

    await connectDb(`SELECT COUNT(*), SUM(amount) FROM transactions WHERE amount > 500000 AND amount < 999999 AND ${type}='${variable}';`).then(result => {
      int_5 = result.rows[0].count;});

    await connectDb(`SELECT COUNT(*), SUM(amount) FROM transactions WHERE amount > 1000000 AND amount < 9999999 AND ${type}='${variable}';`).then(result => {
      int_6 = result.rows[0].count;});

    await connectDb(`SELECT COUNT(*), SUM(amount) FROM transactions WHERE amount > 9999999 AND ${type}='${variable}';`).then(result => {
      int_7 = result.rows[0].count;});

    const histogramData = [
        { label: '[0, 10000[', value: int_1 },
        { label: '[10000, 49999[', value: int_2 },
        { label: '[49999, 99999[', value: int_3 },
        { label: '[100000, 499999[', value: int_4 },
        { label: '[500000, 999999[', value: int_5 },
        { label: '[1000000, 9999999[', value: int_6 },
        { label: '[9999999, inf[', value: int_7 }
        // Add more data as needed
      ];

    res.render('charts', { histogramData});
    return 1;
    }
    async function getResponse () {
      getInfo().then(response => {
        console.log("aca2");
        console.log(response)
        return response;
      });
  }
  
    const PORFAVOR = getResponse()
});

app.get('/dict', async (req, res) => {
  try {
    const dict_origin = await connectDb('SELECT bank_origin FROM transactions GROUP BY bank_origin;');
    const dict_destiny = await connectDb('SELECT bank_destiny FROM transactions GROUP BY bank_destiny;');
    console.log('origin dict');
    console.log(dict_origin);
    console.log('destiny dict');
    console.log(dict_destiny);

    const pairs = [];
    const final_dict = {};

    for (const origin of dict_origin.rows) {
      console.log('origin');
      console.log(origin.bank_origin);

      for (const destiny of dict_destiny.rows) {
        console.log('destiny');
        console.log(destiny.bank_destiny);

        const join = origin.bank_origin + destiny.bank_destiny;
        const check = Number(join);

        console.log(join);
        console.log(check);

        if (!pairs.includes(check) && origin.bank_origin !== destiny.bank_destiny) {
          const org_to_dest = await connectDb(`SELECT SUM(amount) FROM transactions WHERE bank_origin = '${origin.bank_origin}' AND bank_destiny = '${destiny.bank_destiny}';`);
          const dest_to_org = await connectDb(`SELECT SUM(amount) FROM transactions WHERE bank_origin = '${destiny.bank_destiny}' AND bank_destiny = '${origin.bank_origin}';`);

          console.log('org to dest');
          console.log(org_to_dest.rows[0].sum);

          console.log('dest to org');
          console.log(dest_to_org.rows[0].sum);

          const final = org_to_dest.rows[0].sum - dest_to_org.rows[0].sum;
          const num = origin.bank_origin + destiny.bank_destiny;
          const new_num = Number(num);

          pairs.push(new_num);

          if (final >= 0) {
            final_dict[`El banco ${origin.bank_origin} le debe al banco ${destiny.bank_destiny}`] = final;
          } else if (final < 0) {
            final_dict[`El banco ${destiny.bank_destiny} le debe al banco ${origin.bank_origin}`] = final;
          }
        }
      }
    }

    console.log('final dict');
    console.log(final_dict);

    res.send(final_dict);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`));


const html = `
<!DOCTYPE html>
<html>
  <head>
    <title>Hello from Render!</title>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js"></script>
    <script>
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          disableForReducedMotion: true
        });
      }, 500);
    </script>
    <style>
      @import url("https://p.typekit.net/p.css?s=1&k=vnd5zic&ht=tk&f=39475.39476.39477.39478.39479.39480.39481.39482&a=18673890&app=typekit&e=css");
      @font-face {
        font-family: "neo-sans";
        src: url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff2"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("woff"), url("https://use.typekit.net/af/00ac0a/00000000000000003b9b2033/27/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3") format("opentype");
        font-style: normal;
        font-weight: 700;
      }
      html {
        font-family: neo-sans;
        font-weight: 700;
        font-size: calc(62rem / 16);
      }
      body {
        background: white;
      }
      section {
        border-radius: 1em;
        padding: 1em;
        position: absolute;
        top: 50%;
        left: 50%;
        margin-right: -50%;
        transform: translate(-50%, -50%);
      }
    </style>
  </head>
  <body>
    <section>
      hello
    </section>
  </body>
</html>
`