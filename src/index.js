const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const _ = require('lodash');
require('dotenv').config();

class QBOFileProcessor {
  constructor(inputDir = 'input', outputDir = 'output', errorDir = 'error-logs') {
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.errorDir = errorDir;
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.inputDir, this.outputDir, this.errorDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async processFile(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      return new Promise((resolve, reject) => {
        Papa.parse(fileContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const processedData = this.determineAndProcessTransactions(results.data);
            resolve(processedData);
          },
          error: (error) => {
            reject(new Error(`Error parsing CSV: ${error}`));
          }
        });
      });
    } catch (err) {
      throw new Error(`Error reading file ${filePath}: ${err.message}`);
    }
  }

  determineAndProcessTransactions(data) {
    // Group transactions by client and type
    const grouped = _.groupBy(data, 'ClientName');
    
    const results = {};
    for (const [clientName, clientTransactions] of Object.entries(grouped)) {
      results[clientName] = this.processClientTransactions(clientTransactions);
    }
    
    return results;
  }

  processClientTransactions(transactions) {
    const byType = _.groupBy(transactions, row => {
      if (row.Debit && row.Credit) return 'journal';
      if (row.BillNumber || row.DueDate) return 'bill';
      if (row.PurchaseNumber || (row.Vendor && row.Amount)) return 'purchase';
      return 'unknown';
    });

    const results = {
      journal: [],
      bill: [],
      purchase: [],
      unknown: []
    };

    // Process each type with its specific validation
    if (byType.journal) {
      results.journal = this.validateJournalEntries(byType.journal);
    }
    if (byType.bill) {
      results.bill = this.validateBills(byType.bill);
    }
    if (byType.purchase) {
      results.purchase = this.validatePurchases(byType.purchase);
    }
    if (byType.unknown) {
      results.unknown = byType.unknown;
    }

    return results;
  }

  validateJournalEntries(entries) {
    return entries.map(entry => ({
      ...entry,
      valid: !!(entry.Date && entry.DebitAccount && entry.CreditAccount && 
                entry.Debit && entry.Credit && 
                parseFloat(entry.Debit) === parseFloat(entry.Credit))
    }));
  }

  validateBills(bills) {
    return bills.map(bill => ({
      ...bill,
      valid: !!(bill.Date && bill.VendorRef && bill.Amount && 
                bill.DueDate && !isNaN(parseFloat(bill.Amount)))
    }));
  }

  validatePurchases(purchases) {
    return purchases.map(purchase => ({
      ...purchase,
      valid: !!(purchase.Date && purchase.VendorRef && purchase.Amount && 
                !isNaN(parseFloat(purchase.Amount)))
    }));
  }

  logError(clientName, error) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - ${clientName}: ${error}\n`;
    const logFile = path.join(this.errorDir, 'processing-errors.log');
    fs.appendFileSync(logFile, logEntry);
  }

  async watchDirectory() {
    console.log(`Watching for CSV files in ${this.inputDir}`);
    fs.watch(this.inputDir, async (eventType, filename) => {
      if (eventType === 'rename' && filename.endsWith('.csv')) {
        const filePath = path.join(this.inputDir, filename);
        try {
          if (fs.existsSync(filePath)) {
            console.log(`Processing ${filename}...`);
            const results = await this.processFile(filePath);
            this.handleResults(results, filename);
          }
        } catch (err) {
          console.error(`Error processing ${filename}:`, err);
          this.logError('System', err.message);
        }
      }
    });
  }

  handleResults(results, filename) {
    const timestamp = new Date().toISOString().split('T')[0];
    const resultsFile = path.join(this.outputDir, `results-${timestamp}-${filename}`);
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    console.log(`Results saved to ${resultsFile}`);
  }
}

// Start the processor
const processor = new QBOFileProcessor();
processor.watchDirectory();

module.exports = QBOFileProcessor;