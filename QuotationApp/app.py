import os
import json
from flask import Flask, render_template, request, jsonify, send_file
from datetime import datetime
from utils import generate_excel_bill
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
app.config['UPLOAD_FOLDER'] = 'uploads'

# Database files
DB_FILE = 'database/products.json'
COMPANIES_FILE = 'database/companies.json'

def ensure_db_exists():
    """Create database files if they don't exist"""
    os.makedirs('database', exist_ok=True)
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, 'w') as f:
            json.dump([], f)
    if not os.path.exists(COMPANIES_FILE):
        with open(COMPANIES_FILE, 'w') as f:
            json.dump([], f)

def load_products():
    """Load all products from JSON"""
    ensure_db_exists()
    try:
        with open(DB_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_products(products):
    """Save products to JSON"""
    ensure_db_exists()
    with open(DB_FILE, 'w') as f:
        json.dump(products, f, indent=2)

def load_companies():
    """Load all companies from JSON"""
    ensure_db_exists()
    try:
        with open(COMPANIES_FILE, 'r') as f:
            return json.load(f)
    except:
        return []

def save_companies(companies):
    """Save companies to JSON"""
    ensure_db_exists()
    with open(COMPANIES_FILE, 'w') as f:
        json.dump(companies, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/companies', methods=['GET'])
def get_companies():
    companies = load_companies()
    return jsonify(companies)

@app.route('/api/add-company', methods=['POST'])
def add_company():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        
        if not name:
            return jsonify({'error': 'Company name required'}), 400
        
        companies = load_companies()
        
        # Check if company already exists
        if any(c['name'].lower() == name.lower() for c in companies):
            return jsonify({'error': 'Company already exists'}), 400
        
        new_company = {
            'id': len(companies) + 1,
            'name': name,
            'subcategories': []
        }
        
        companies.append(new_company)
        save_companies(companies)
        
        return jsonify({'success': True, 'company': new_company})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-company/<int:company_id>', methods=['DELETE'])
def delete_company(company_id):
    try:
        companies = load_companies()
        companies = [c for c in companies if c['id'] != company_id]
        save_companies(companies)
        
        # Delete all products of this company
        products = load_products()
        products = [p for p in products if p.get('company_id') != company_id]
        save_products(products)
        
        return jsonify({'success': True, 'message': 'Company deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/add-subcategory/<int:company_id>', methods=['POST'])
def add_subcategory(company_id):
    try:
        data = request.get_json()
        subcategory = data.get('subcategory', '').strip()
        
        if not subcategory:
            return jsonify({'error': 'Subcategory name required'}), 400
        
        companies = load_companies()
        company = next((c for c in companies if c['id'] == company_id), None)
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        if subcategory in company['subcategories']:
            return jsonify({'error': 'Subcategory already exists'}), 400
        
        company['subcategories'].append(subcategory)
        save_companies(companies)
        
        return jsonify({'success': True, 'subcategory': subcategory})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-subcategory/<int:company_id>/<subcategory>', methods=['DELETE'])
def delete_subcategory(company_id, subcategory):
    try:
        companies = load_companies()
        company = next((c for c in companies if c['id'] == company_id), None)
        
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        if subcategory in company['subcategories']:
            company['subcategories'].remove(subcategory)
            save_companies(companies)
        
        # Delete products in this subcategory
        products = load_products()
        products = [p for p in products if not (p.get('company_id') == company_id and p.get('subcategory') == subcategory)]
        save_products(products)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products', methods=['GET'])
def get_products():
    company_id = request.args.get('company_id', type=int)
    products = load_products()
    
    if company_id:
        products = [p for p in products if p.get('company_id') == company_id]
    
    return jsonify(products)

@app.route('/api/add-product', methods=['POST'])
def add_product():
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        price = float(data.get('price', 0))
        company_id = int(data.get('company_id', 0))
        subcategory = data.get('subcategory', '')
        
        if not name or price <= 0 or not company_id:
            return jsonify({'error': 'Invalid product data'}), 400
        
        products = load_products()
        
        # Check if product already exists in this company
        if any(p['name'].lower() == name.lower() and p.get('company_id') == company_id for p in products):
            return jsonify({'error': 'Product already exists in this company'}), 400
        
        new_product = {
            'id': len(products) + 1,
            'name': name,
            'price': price,
            'company_id': company_id,
            'subcategory': subcategory,
            'discount': 0
        }
        
        products.append(new_product)
        save_products(products)
        
        return jsonify({'success': True, 'product': new_product})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/update-discount', methods=['POST'])
def update_discount():
    try:
        data = request.get_json()
        product_ids = data.get('product_ids', [])
        discount = float(data.get('discount', 0))
        
        if discount < 0 or discount > 100:
            return jsonify({'error': 'Discount must be between 0 and 100'}), 400
        
        products = load_products()
        for product in products:
            if product['id'] in product_ids:
                product['discount'] = discount
        
        save_products(products)
        return jsonify({'success': True, 'message': f'Updated {len(product_ids)} product(s)'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/delete-product/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    try:
        products = load_products()
        products = [p for p in products if p['id'] != product_id]
        save_products(products)
        
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-bill', methods=['POST'])
def generate_bill():
    try:
        data = request.get_json()
        items = data.get('items', [])
        gst_rate = float(data.get('gst_rate', 18))
        
        if not items:
            return jsonify({'error': 'No items in cart'}), 400
        
        filename = generate_excel_bill(items, gst_rate)
        return send_file(filename, as_attachment=True, download_name='quotation.xlsx')
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    ensure_db_exists()
    app.run(debug=True, host='127.0.0.1', port=5000)

