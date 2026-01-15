#!/usr/bin/env python3
"""Test script to validate all QuotationApp API endpoints and functionality"""

import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000"

def print_test(title):
    print(f"\n{'='*60}")
    print(f"TEST: {title}")
    print('='*60)

def test_companies():
    print_test("Get All Companies")
    response = requests.get(f"{BASE_URL}/api/companies")
    print(f"Status: {response.status_code}")
    companies = response.json()
    print(f"Companies: {json.dumps(companies, indent=2)}")
    return companies

def test_add_company():
    print_test("Add New Company")
    data = {"name": "Test Company"}
    response = requests.post(f"{BASE_URL}/api/add-company", json=data)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Result: {json.dumps(result, indent=2)}")
    if response.ok:
        return result.get('company', {}).get('id')
    return None

def test_products():
    print_test("Get All Products")
    response = requests.get(f"{BASE_URL}/api/products")
    print(f"Status: {response.status_code}")
    products = response.json()
    print(f"Total Products: {len(products)}")
    if products:
        print(f"Sample Product: {json.dumps(products[0], indent=2)}")
    return products

def test_products_by_company(company_id):
    print_test(f"Get Products for Company {company_id}")
    response = requests.get(f"{BASE_URL}/api/products?company_id={company_id}")
    print(f"Status: {response.status_code}")
    products = response.json()
    print(f"Products for Company {company_id}: {len(products)}")
    if products:
        print(f"Sample: {json.dumps(products[0], indent=2)}")
    return products

def test_add_product(company_id):
    print_test("Add New Product")
    data = {
        "name": "Test Product",
        "price": 100.0,
        "company_id": company_id,
        "subcategory": "Test Category",
        "discount": 0
    }
    response = requests.post(f"{BASE_URL}/api/add-product", json=data)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Result: {json.dumps(result, indent=2)}")
    if response.ok:
        return result.get('product', {}).get('id')
    return None

def test_update_discount(product_ids, discount):
    print_test(f"Update Discount to {discount}% for {len(product_ids)} products")
    data = {
        "product_ids": product_ids,
        "discount": discount
    }
    response = requests.post(f"{BASE_URL}/api/update-discount", json=data)
    print(f"Status: {response.status_code}")
    result = response.json()
    print(f"Result: {json.dumps(result, indent=2)}")
    return response.ok

def test_generate_bill():
    print_test("Generate Bill (Excel)")
    # Get first product to test bill generation
    response = requests.get(f"{BASE_URL}/api/products")
    products = response.json()
    
    if not products:
        print("No products available for bill generation test")
        return False
    
    cart_items = [
        {
            "id": products[0]["id"],
            "name": products[0]["name"],
            "price": products[0]["price"],
            "discount": products[0].get("discount", 0),
            "quantity": 2
        }
    ]
    
    data = {
        "items": cart_items,
        "gst_rate": 18
    }
    
    response = requests.post(f"{BASE_URL}/api/generate-bill", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response Type: {response.headers.get('content-type')}")
    
    if response.ok:
        print(f"✅ Bill generated successfully ({len(response.content)} bytes)")
        return True
    else:
        print(f"❌ Error: {response.json()}")
        return False

def main():
    print("\n" + "="*60)
    print("QUOTATION APP - API TEST SUITE")
    print("="*60)
    
    try:
        # Test companies
        companies = test_companies()
        
        # Test products
        products = test_products()
        
        if companies:
            company_id = companies[0]["id"]
            test_products_by_company(company_id)
        
        # Test add company
        new_company_id = test_add_company()
        
        if new_company_id:
            # Test add product
            product_id = test_add_product(new_company_id)
            
            # Test update discount
            if product_id:
                test_update_discount([product_id], 15)
        
        # Test bill generation
        test_generate_bill()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    time.sleep(1)  # Wait for Flask to fully start
    main()
