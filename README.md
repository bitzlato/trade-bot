# trade-bot
Simple trade bot to show bitzlato exchange API

Вы можете задавать:
- Пары для торговли
- Объем выставляемого ордера в долларах 
- Количество выставляемых ордеров
- Переменную отклонения от курса на покупку и/или продажу

## Как установить

```
git clone https://github.com/bitzlato/trade-bot.git
cd trade-bot
npm install
```

## Как запускать

Для запуска необходим API токен. Сгенерировать его можно по адресу https://bitzlato.com/p2p/tools

```
node index.js --token "16e2af1f-4231-4370-a127-ca00280e568b"
```

### Внимание!
Сейчас бот не умеет работать на парах с RUBM и USDM. Чтобы он не падал с ошибкой, необходимо перечислить пары в параметре запуска `--pairs`
Например:
```
node index.js --token "c4e2b089-4573-45fe-b882-80828569b5dc" --pairs=ETH-BTC,LTC-BTC,DASH-BTC,LTC-ETH,DASH-ETH
```

Остальные параметры:
```
node index.js --help

Options:
  --token <token>    API Token
  --api [api]        API endpoint
  --pause [pause]    Pause in ms between ticks. Default 30000
  --random [random]  Place random orders. Default false
  --amount [amount]  Order amount in USD. Default 1 USD
  --pairs [pairs]    List of comma-separated bitzlato pairs to work on. Default all
  --bid-levels [bidLevels]  List of comma-separated multipliers for buying orders. Default 1.0 0.95 0.9 0.85 0.8
  --ask-levels [askLevels]  List of comma-separated multipliers for selling orders. Default 1.0 1.05 1.1 1.15 1.2
  -h, --help         output usage information
```

Например:
```
node index.js --api https://bitzlato.com/api \
  --token "dfbde5a6-119b-4c44-8194-0d6024093ead" \
  --pause=10000 \
  --amount 10 \
  --pairs ETH-BTC,ETH-BCH \
  --bid-levels 0.95 \
  --ask-levels 1.05,1.12 \
  /
```

Каждые 10 секунд бот проверят курсы на kraken, отменяет свои старые ордера, выставляет новый ордер -5% на покупку, и два ордера на продажу +5% и +12%.

## API BITZLATO EXCHANGE
_API in russian language is here https://github.com/bitzlato/trade-bot/blob/master/API_bitzlato_exchange_RUS.md_

** IMPORTANT **: the list of methods, parameters and data format may change while the exchange is in beta testing mode.

# General description

** IMPORTANT **: Any value representing the number of cryptocurrencies is always transmitted as a string! Money management Precision
 is managed by the server.

** ATTENTION **: all `GET`-parameters (going after`? `) are optional, for the` limit` and `skip` parameters on the server 
should be used default values. (100 and 0 but may depend on the type of request).

All routes starting at `/ api / market / v1 / public /` are public and are processed without access control.
Routes starting with `/ api / market / v1 / private /: userId /` require authentication and verification that
the passed access token belongs to user `userId`.

# Getting information about the user

Allows you to get `userId` for future use.

## GET / api / auth / whoami

    {
        name: ...,
        userId: ...,
    }

* `name` - user's nickname
*
* `userId` - numeric user id

# Currency pairs

## GET / api / market / v1 / public / pairs /

Getting a list of currency pairs.

Answer format:

    [
      {
        id: ...,
        label: ...,
        status: ...,
        price: {
          min: ...,
          max: ...,
          last: ...
        },
        volume: {
          base: ...,
          quote: ...
        },
        priceChange: ...,
      },
      ....
    ]
    
The format for describing a currency pair is the same as the response format of the `GET / api / market / v1 / public / pairs /: id` route.
    

## GET / api / market / v1 / public / pairs /: id

Getting information about the currency pair with the identificator id.

Answer format:

    {
      id: ...,
      label: ...,
      status: ...,
      price: {
        min: ...,
        max: ...,
        last: ...
      },
      volume: {
        base: ...,
        quote: ...
      },
      priceChange: ...,
    }
    
* `id` - currency pair identifier in the format`: (base) - :( quote) `, where
  `base` is the` base` currency, and `quote` is the quoted currency
  
* `label` - the displayed name of the currency pair may be the same as ʻid`, but it may differ
  
* `status` - currency pair status, possible values:` active`, `frozen`

* `price` - information about the exchange rate for this currency pair

* `price.min` - the maximum price for the last 24 hours

* `price.max` - the minimum price for the last 24 hours

* `price.last` - the price of the last transaction

* `volume` - trading volume for this currency pair in the last 24 hours

* `volume.base` - volume in base currency

* `volume.quote` - volume in quoted currency

* `priceChange` - price change for 24 hours, the sign is an indicator of the direction of change

# Work with public orders

## GET / api / market / v1 / public / orders /: pair /: offerType

Getting a list of active (open) orders.

The result should be sorted by price:

for `bid` from the highest to the lowest

for `ask` from the lowest to the highest

Request parameters:

* `pair` - currency pair identifier

* `offerType` - order type, possible options:` bid` or `ask`

Answer format:

    {
      data: [
        {
          id: ...,
          pair: ...,
          offerType: ...,
          amount: ...,
          price: ...
        },
        ...
      ],
      maxCount: ...
   }
   
* `data` - an array with order descriptions that should be sorted by` data.price`: in the case of `bid` by
   ascending, and in the case of an `ask` descending.
    
* `data.pair` - currency pair identifier

* `data.offerType` - type of order, possible options:` bid` or `ask`

* `data.amount` - order size in the` base` currency

* `data.price` - the price of the` base` currency in the `quoted`

* `maxCount` - the maximum number of records that the server can return (the actual number can be
  less)

## GET / api / market / v1 / public / trades /: pair /

Getting a list of recent deals (see `order_logs`). Request parameters:

* `: pair` - currency pair identifier

Answer format:

    {
      data: [
        {
          id: ...,
          amount: {
             base: ...,
             quote: ...
          },
          price: ...,
          date: ...,
          type: ...
        },
        ...
      ],
      maxCount: ...
    }
    
* `data` - an array with descriptions of recent deals

* `data.id` - deal ID

* `data.amount` - description of the deal size

* `data.amount.base` - deal size in the` base` currency

* `data.amount.quote` - deal size in` quoted 'currency

* `data.price` - the price of the` base` currency in the `quoted`

* `data.date` - the date of the transaction

* `data.side` - the type of the deal` sell` or `buy` is determined by the type of a new order

* `maxCount` - the maximum number of records that the server can return (the actual number can be
  less)


# Work with your own orders

## GET / api / market / v1 / private /: userId / orders /: orderId

Getting a description of your own order

    {
      id: ...,
      pair: ...,
      isActive: ...,
      offerType: ...,
      amount: {
        origin: ...,
        matched: ...,
        rest: ...
      },
      price: ...,
      fee: ...,
      status: ...,
      created: ...
    }
    
* `id` - order identifier

* `pair` - currency pair identifier

* `isActive` - a boolean sign that the order is active

* `status` - description of the order processing status

* `offerType` - order type, possible options:` bid` or `ask`

* `price` - the price of the` base` currency in the `quoted`

* `amount` - description of the order size in the` base` currency

* `amount.origin` - the size specified when creating the order

* `amount.matched` - the total size of deals executed on the order

* `amount.rest` - how much is left before the order is closed
    
## DELETE / api / market / v1 / private /: userId / orders /: orderId

Cancel Order.

## GET / api / market / v1 / private /: userId / orders /? Pair =: pair & limit =: limit & skip =: skip

* `pair` - currency pair identifier

* `limit` - limit on the number of returned records

* `skip` - the number of records that must be skipped

Getting a list of your own orders. Answer format:

    {
      data: [
        {
          ...
        }
      ],
      total: ...
    }

* `data` - list of order descriptions in the same format as the route response format
  `GET / api / market / v1 / private /: userId / orders /: orderId`

* `total` - the total number of orders that satisfy the filtering conditions

## POST / api / market / v1 / private /: userId / orders /

Create a new order.

Request format:

    {
      pair: ...,
      offerType: ...,
      amount: ...,
      price: ...
    }
    
* `pair` - currency pair identifier

* `offerType` - order type, possible options:` bid` or `ask`

* `price` - the price of the` base` currency in the `quoted`

* `amount` - description of the order size in the` base` currency

The response format is the same as the response format of the `GET / api / market / v1 / private /: userId / orders /: orderId` route.

## POST / api / market / v1 / private /: userId / orders / idle

It allows you to evaluate the result of the creation of an order without actually creating it.

The request format is the same as the request route format `POST / api / market / v1 / private /: userId / orders /`.

The response format is the same as the response format of the `GET / api / market / v1 / private /: userId / orders /: orderId` route.
Exception, `id` fields that cannot be determined.

## GET / api / market / v1 / private /: userId / trades /? OrderId =: orderId & pair =: pair & limit =: limit & skip =: skip

Getting your own transaction history. Possible query parameters:

* `orderId` - order identifier

* `pair` - currency pair identifier

* `limit` - limit on the number of returned records

* `skip` - the number of records that must be skipped

Answer format:

    {
      data: [
        {
          id: ...,
          pair: ...,
          action: ...,
          amount: {
             base: ...,
             quote: ...
          },
          price: ...,
          date: ...,
          side: ...,
          fee: ...
        }
      ],
      total: ...
    }
    
* `data` - an array of descriptions of completed deals

* `data.id` - deal ID

* `data.pair` - currency pair identifier

* `data.action` - type of action, possible options:` bid` or `ask`

* `data.amount` - description of the deal size

* `data.amount.base` - deal size in the` base` currency

* `data.amount.quote` - deal size in` quoted 'currency

* `data.price` - the price of the` base` currency in the `quoted`

* `data.date` - the date of the deal

* `data.side` - the type of the deal` sell` or `buy` is determined by the type of a new order

* `data.fee` - the size of the deal commission. The commission is always specified in the currency that the user received in
  the result of the transaction

* `total` - the total number of deals that satisfy the filtering conditions

# Statistics

## GET / api / market / v1 / public / stats / candlestick /: pair? After =: after & before =: before & width =: width

Getting data to display "candlesticks".

Request parameters:

* `pair` - currency pair identifier

* `after` - time limit below the requested data.

* `before` - the time limit on top of the requested data, the default value is the current time

* `width` - interval width, possible values:` 1h` (one hour), `1d` (one day). In the future, you may add
  other values ​​(see binance). The default is `1h`.

In the case when the number of requested candles (`(before - after) / width`) is greater than` 200` (any reasonable digit written
in the configuration file) - return the error `400 Bad Request`.

The values ​​of `after` and` before` should be rounded down and up, respectively, along the boundaries
intervals. For example, if the query is `width = 1h`, and` after = 19: 10` (in fact, the query will be `unix-time`), then in
As the first "candle" it is necessary to return the one that starts at `19: 00`.

Answer format:

    [
      {
        date: ...,
        price: {
          open: ...,
          close: ...,
          high: ...,
          low: ...
        },
        volume: {
          base: ...,
          quote: ...
        }
      },
      ...
    ]

The array contains a list of descriptions of "candles" with the following fields:

* `date` - the date of the creation of the candle, the beginning of the time interval corresponding to this candle

* `price` - price data of the` base` currency in `quoted 'during the interval

* `price.open` - at the beginning of the interval

* `price.close` - at the end of the interval

* `price.hight` - maximum for the interval

* `price.low` - minimum for the interval

* `volume` - turnover data for the interval

* `volume.base` - in` base` currency

* `volume.quote` - in` quoted 'currency
