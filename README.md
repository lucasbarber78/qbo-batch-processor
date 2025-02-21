# QuickBooks Online Batch Processor

A comprehensive system for batch processing QuickBooks Online transactions across multiple clients using n8n workflows and CDATA Excel Add-in integration.

## Features

- Multi-client transaction processing
- Automatic transaction type detection
- Support for Journal Entries, Bills, and Purchases
- n8n workflow automation
- React-based web interface
- Comprehensive error handling and validation

## Setup

### Prerequisites

1. n8n installed and running
2. CDATA Excel Add-in for QuickBooks Online
3. QuickBooks Online accounts configured
4. Node.js and npm installed

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lucasbarber78/qbo-batch-processor.git
cd qbo-batch-processor
```

2. Install dependencies:
```bash
npm install
```

3. Configure client credentials in `config/clients.json`

4. Import n8n workflow from `workflows/qbo-batch-workflow.json`

## Usage

### CSV File Format

#### Journal Entries
```csv
ClientName,Date,DebitAccount,CreditAccount,Debit,Credit,Description
Client1,2024-02-21,1000,2000,100.00,100.00,Monthly adjustment
```

#### Bills
```csv
ClientName,Date,VendorRef,APAccountRef,DueDate,Amount
Client1,2024-02-21,VEND123,2000,2024-03-21,500.00
```

#### Purchases
```csv
ClientName,Date,VendorRef,AccountRef,Amount,PaymentType
Client1,2024-02-21,VEND123,1000,250.00,Check
```

### Running the Processor

1. Place CSV files in the designated input folder
2. Files will be automatically processed based on n8n workflow trigger
3. Check the logs for processing results
4. Review error reports if any issues occur

## Project Structure

```
qbo-batch-processor/
├── src/
│   ├── components/         # React components
│   ├── utils/             # Utility functions
│   └── services/          # Business logic
├── workflows/             # n8n workflow definitions
├── config/               # Configuration files
├── templates/            # CSV templates
└── docs/                # Additional documentation
```

## Configuration

### Client Setup

1. Create a client configuration in `config/clients.json`:
```json
{
  "Client1": {
    "qboCredentials": {
      "clientId": "xxx",
      "clientSecret": "xxx"
    }
  }
}
```

2. Configure n8n credentials for each client

### Error Handling

- Failed transactions are logged to `error-logs/`
- Email notifications can be configured in n8n workflow
- Retry mechanism available for failed transactions

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT License - see LICENSE file for details