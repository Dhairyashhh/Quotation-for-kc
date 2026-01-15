# Quotation & Billing System

A local web application to manage product catalogues and generate professional quotations/bills.

## Features

✅ **No API Costs - Completely Free!**
- Manually extract products from your PDFs using ChatGPT's web interface
- Copy-paste the data into the app (intelligent parser removes unnecessary text)
- OR manually add products one by one

✅ **Smart Data Parsing**
- Intelligently extracts product names and prices from messy ChatGPT output
- Handles multiple formats: "Product | Price", "Product - Price", etc.
- Ignores fluff text like "Here's your information extracted from PDF"

✅ **Database Management**
- SQLite database to store all products
- Automatic deduplication
- Search and filter products

✅ **Shopping Cart & Billing**
- Browse and search products
- Add/remove items from cart
- Adjust quantities
- Real-time bill calculation with customizable GST

✅ **Excel Bill Generation**
- Professional quotation format
- Item details: name, quantity, unit price, total price
- GST calculations
- Formatted currency and totals

## System Requirements

- Python 3.8 or higher
- Windows 10/11 (or any OS with Python)
- 200MB free disk space
- Web browser (Chrome, Firefox, Edge, Safari)

## Installation & Setup

### Step 1: Install Python
- Download from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

### Step 2: Install Dependencies
Open PowerShell in the QuotationApp folder and run:

```powershell
pip install -r requirements.txt
```

If you get "pip not found", use:
```powershell
python -m pip install -r requirements.txt
```

### Step 3: Run the Application
In PowerShell (in the QuotationApp folder), run:

```powershell
python app.py
```

You should see:
```
WARNING in app.runserver: This is a development server. Do not use it in production.
 * Running on http://127.0.0.1:5000
```

### Step 4: Access the Application
Open your web browser and go to:
```
http://127.0.0.1:5000
```

You should see the Quotation & Billing System interface.

## How to Use

### Option 1: Copy-Paste from ChatGPT (Free & No API Key Needed)

**Step 1: Prepare your data in ChatGPT**
```
You: "Extract product names and prices from this PDF [paste your PDF content]"
ChatGPT: "Here are the products from your catalog:
1. Widget A - ₹100
2. Widget B - ₹250
..."
```

**Step 2: In the app, go to "Add Products" tab**
- Click "Paste from ChatGPT"
- Copy ChatGPT's entire response and paste into the textarea
- The app will intelligently extract products
- Click "Parse & Add Products"

**Smart Parser Features:**
- Removes numbering (1., 2., etc.)
- Handles various separators: "|" "-" ":" "→"
- Removes fluff text like "Here are the products..."
- Works with currency symbols: ₹ Rs $ etc.
- Ignores empty lines

**Example inputs that work:**
```
1. Product Name - ₹100
2. Another Item | 250
Widget C → ₹300
Product D, 450
```

### Option 2: Manual Entry (One by One)

- Click "Add Products" → "Manual Entry" tab
- Enter product name
- Enter price
- Click "Add Product"
- Repeat for all products

### Option 3: Manage Products (After Adding)

- View all products in "Product List" section
- Search for products using search box
- Click "Add" button to add to cart

### Create a Bill

1. Add products to cart (click "Add" button)
2. Adjust quantities using +/- buttons
3. Set GST rate (default: 18%)
4. View bill summary on the right
5. Click "Generate Bill (Excel)" to download

### Excel Bill Format

The generated Excel file includes:
- Item names
- Quantities
- Unit prices
- Total prices (quantity × unit price)
- Subtotal
- GST amount (calculated automatically)
- Final total

All formatted with currency symbols and colors.

## Optional: Use API for Automated PDF Extraction

If you want the app to automatically extract products from PDFs without ChatGPT:

**Step 1: Get OpenAI API Key**
1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key

**Step 2: Add API Key**
1. Open `.env` file in the QuotationApp folder
2. Paste your API key: `OPENAI_API_KEY=sk-...`
3. Save

**Step 3: Upload PDF**
- Click "Add Products" tab (still available when API key is set)
- Drag & drop PDF or click to select
- App will extract products automatically

**Note:** API has costs. Check OpenAI pricing.

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'flask'"
**Solution:** Run the installation step again:
```powershell
pip install -r requirements.txt
```

### Issue: Port 5000 already in use
**Solution:** 
1. Close other applications using port 5000
2. Or modify `app.py` last line: change `port=5000` to `port=5001`

### Issue: Parser not extracting products correctly
**Solution:** Try these formats:
```
Product Name | Price
Product Name - Price  
Product Name, Price
```

Make sure product name and price are separated by one of these: | - : → ,

### Issue: Excel file not downloading
**Solution:**
1. Check browser download folder
2. Try different browser
3. Reload the page

### Issue: "Cannot find python"
**Solution:**
1. Make sure Python is installed from python.org
2. During installation, check "Add Python to PATH"
3. Restart PowerShell after installing Python

## File Structure

```
QuotationApp/
├── app.py                 # Main Flask application
├── models.py              # Database models
├── utils.py               # Excel generation (PDF extraction if using API)
├── requirements.txt       # Python dependencies
├── .env                   # Configuration (optional API key)
├── README.md              # This file
├── templates/
│   └── index.html         # Web interface
├── static/
│   ├── style.css          # Styling
│   └── script.js          # Frontend logic with smart parser
├── uploads/               # Uploaded PDFs (if using API)
└── database/
    └── products.db        # SQLite database
```

## Tips & Best Practices

1. **Backup Database:** Copy `database/products.db` regularly to backup your products
2. **Clear Database:** Delete `database/products.db` to start fresh (app will recreate it)
3. **Currency Format:** App supports ₹ (Indian Rupee) by default
4. **Duplicate Prevention:** Same product name + price won't be added twice
5. **Data Accuracy:** Always verify ChatGPT's extracted data

## Free Features

- ✅ Unlimited products
- ✅ Unlimited bills
- ✅ Unlimited cart items
- ✅ Runs completely offline (no cloud sync)
- ✅ No API calls (unless you choose to use API)

## Support

For issues:
1. Check Troubleshooting section above
2. Verify all dependencies installed: `pip install -r requirements.txt`
3. Check console output for error messages
4. Make sure you have internet for ChatGPT (manual extraction)

## License

This application is for personal use.

---

**Happy Billing! 📊💰 No costs, just productivity!**

