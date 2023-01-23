import axios from 'axios'
import chalk from 'chalk'
import cheerio from 'cheerio'
import fs from 'fs'
import moment from 'moment'
import ObjectsToCsv from 'objects-to-csv'
import Papa from 'papaparse'

const domains = [
  'https://receive-smss.com/sms/15158177357',
  'https://receive-smss.com/sms/17632736140',
  'https://receive-smss.com/sms/212770540034',
  'https://receive-smss.com/sms/23057219237',
  'https://receive-smss.com/sms/23058513614',
  'https://receive-smss.com/sms/2348153353131',
  'https://receive-smss.com/sms/31616425157',
  'https://receive-smss.com/sms/33780746669',
  'https://receive-smss.com/sms/33780854861',
  'https://receive-smss.com/sms/34658192436',
  'https://receive-smss.com/sms/34658192458',
  'https://receive-smss.com/sms/380633190936',
  'https://receive-smss.com/sms/380931523352',
  'https://receive-smss.com/sms/380934611536',
  'https://receive-smss.com/sms/380999134159',
  'https://receive-smss.com/sms/40720563461',
  'https://receive-smss.com/sms/40731883501',
  'https://receive-smss.com/sms/420703654125',
  'https://receive-smss.com/sms/420721482480',
  'https://receive-smss.com/sms/420721482610',
  'https://receive-smss.com/sms/447342769960',
  'https://receive-smss.com/sms/447342769982',
  'https://receive-smss.com/sms/447342780008',
  'https://receive-smss.com/sms/447342780080',
  'https://receive-smss.com/sms/447376493559',
  'https://receive-smss.com/sms/447376494399',
  'https://receive-smss.com/sms/447398668365',
  'https://receive-smss.com/sms/447398668366',
  'https://receive-smss.com/sms/447467285762',
  'https://receive-smss.com/sms/447467285767',
  'https://receive-smss.com/sms/447498173567',
  'https://receive-smss.com/sms/447498173582',
  'https://receive-smss.com/sms/447548032886',
  'https://receive-smss.com/sms/447548032890',
  'https://receive-smss.com/sms/447548032916',
  'https://receive-smss.com/sms/447591166622',
  'https://receive-smss.com/sms/447591195682',
  'https://receive-smss.com/sms/447594594211',
  'https://receive-smss.com/sms/447599143079',
  'https://receive-smss.com/sms/447708969269',
  'https://receive-smss.com/sms/447716535176',
  'https://receive-smss.com/sms/447842646356',
  'https://receive-smss.com/sms/447842646591',
  'https://receive-smss.com/sms/447846037301',
  'https://receive-smss.com/sms/447868135628',
  'https://receive-smss.com/sms/447868150468',
  'https://receive-smss.com/sms/447868150810',
  'https://receive-smss.com/sms/447903612563',
  'https://receive-smss.com/sms/447904694150',
  'https://receive-smss.com/sms/447923432061',
  'https://receive-smss.com/sms/447923432062',
  'https://receive-smss.com/sms/447933447754',
  'https://receive-smss.com/sms/447938562268',
  'https://receive-smss.com/sms/447938585598',
  'https://receive-smss.com/sms/447944633730',
  'https://receive-smss.com/sms/447946268462',
  'https://receive-smss.com/sms/447951668997',
  'https://receive-smss.com/sms/48727801893',
  'https://receive-smss.com/sms/48727801958',
  'https://receive-smss.com/sms/48727842536',
  'https://receive-smss.com/sms/528135607941',
  'https://receive-smss.com/sms/559551583801',
  'https://receive-smss.com/sms/639669917662',
  'https://receive-smss.com/sms/639669917700',
  'https://receive-smss.com/sms/639669917830',
  'https://receive-smss.com/sms/79366199804',
  'https://receive-smss.com/sms/79366199806',
  'https://receive-smss.com/sms/79366199905',
  'https://receive-smss.com/sms/79366199907',
  'https://receive-smss.com/sms/85263052773',
  'https://receive-smss.com/sms/917428723247',
  'https://receive-smss.com/sms/917428730894',
  'https://receive-smss.com/sms/972552603210',
  'https://receive-smss.com/sms/972552992023',
]

function getDateFromTimeAgo(
  origin: moment.MomentInput,
  timeString: string,
): string {
  const timeAgo = { hours: '0', minutes: '0', seconds: '0' }

  const secondAgoMatches = timeString.match(/^(\d+) (second? ago)/)
  const secondsAgoMatches = timeString.match(/^(\d+) (seconds? ago)/)
  const minuteAgoMatches = timeString.match(/^(\d+) (minute? ago)/)
  const minutesAgoMatches = timeString.match(/^(\d+) (minutes? ago)/)
  const hourAgoMatches = timeString.match(/^(\d+) (hour? ago)/)
  const hoursAgoMatches = timeString.match(/^(\d+) (hours? ago)/)

  if (secondAgoMatches) {
    timeAgo.seconds = '1'
  }
  if (secondsAgoMatches) {
    timeAgo.seconds = secondsAgoMatches[1]
  }
  if (minuteAgoMatches) {
    timeAgo.minutes = '1'
  }
  if (minutesAgoMatches) {
    timeAgo.minutes = minutesAgoMatches[1]
  }
  if (hourAgoMatches) {
    timeAgo.hours = '1'
  }
  if (hoursAgoMatches) {
    timeAgo.hours = hoursAgoMatches[1]
  }

  return moment(origin)
    .subtract(timeAgo.seconds, 'seconds')
    .subtract(timeAgo.minutes, 'minutes')
    .subtract(timeAgo.hours, 'hours')
    .add(30, 'seconds')
    .startOf('minute')
    .format()
}

type Message = {
  Sender: string
  Time: string
  Message: string
  Number: string
}

async function init() {
  console.log(
    chalk.bgBlackBright.green.bold(
      `Running job 🛠️ at ${moment(moment.now()).format('Do MMM HH:mm')}`,
    ),
  )

  // Load existing CSV if exists
  let csvData: Array<Message> | undefined
  try {
    if (fs.existsSync('messages.csv')) {
      const file = fs.createReadStream('messages.csv')
      const loadCsv: Promise<Array<Message>> = new Promise(
        (resolve, reject) => {
          Papa.parse(file, {
            worker: true,
            header: true,
            delimiter: ',',
            skipEmptyLines: true,
            complete: (r: any) => {
              resolve(r.data)
            },
          })
        },
      )
      csvData = await loadCsv
    }
  } catch (err) {
    // do nothing
  }

  // For each URL, scrape the table and add to CSV
  let runningCount = 0
  domains.forEach(async (domain, i) => {
    // Extract phone number from URL
    const rgx = domain.match(/https\:\/\/receive\-smss\.com\/sms\/(.*)/)
    if (rgx == null || rgx.length < 1) {
      return
    }
    const recipient = rgx[1]

    // Connect to site
    const requestTime = moment.now()
    const response = await axios(domain)
    const html = await response.data
    const $ = cheerio.load(html)
    const allRows = $('table > tbody > tr')

    // Extract table data
    const messages: any[] = []
    allRows.each((rowInt, element) => {
      // Parse and format row
      const tds = $(element).find('td')
      const sender = $(tds[0]).text().trimStart().trimEnd()
      const rawTime = $(tds[1]).text().trimStart().trimEnd()
      const time = getDateFromTimeAgo(requestTime, rawTime)
      const message = $(tds[2]).text().trimStart().trimEnd()

      // Ensure the message isn't in the CSV already
      if (csvData) {
        const messageExists = csvData.find(
          (csvMessage: any) =>
            csvMessage.Message === message &&
            csvMessage.Recipient === recipient,
        )
        if (messageExists) return
      }

      // Add to messages array
      messages.push({
        Sender: sender,
        Recipient: recipient,
        Time: time,
        Message: message,
      })
    })

    // Append to csv
    const csv = new ObjectsToCsv(messages)
    await csv.toDisk('./messages.csv', { append: true })
    runningCount = runningCount + 1
    console.log(
      `${moment(moment.now()).format(
        'Do MMM HH:mm',
      )} (📱${' '}${runningCount}/${domains.length})`,
    )
  })
}

// Run the scraper every minute
setInterval(() => init(), 60 * 1000)
init()
