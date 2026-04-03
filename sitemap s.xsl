<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>Sitemap - Nothing Space</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body { 
            font-family: monospace; 
            background-color: #000; 
            color: #fff; 
            margin: 0; 
            padding: 30px; 
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .header { 
            background-color: #0c0c0c; 
            padding: 20px; 
            border: 1px solid #333; 
            border-radius: 10px; 
            margin-bottom: 20px;
          }
          h1 { 
            margin: 0 0 10px 0; 
            font-size: 24px; 
            color: #fff; 
            text-transform: uppercase; 
            letter-spacing: 2px;
          }
          p { 
            color: #888; 
            font-size: 14px; 
            margin: 0;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            background-color: #0c0c0c; 
            border: 1px solid #333; 
            border-radius: 10px; 
            overflow: hidden;
          }
          th { 
            background-color: #1a1a1a; 
            text-align: left; 
            padding: 15px; 
            font-size: 14px; 
            text-transform: uppercase; 
            color: #aaa;
            border-bottom: 1px solid #333;
          }
          td { 
            padding: 15px; 
            border-bottom: 1px solid #222; 
            font-size: 14px; 
          }
          tr:hover td { 
            background-color: #111; 
          }
          a { 
            color: #4da6ff; 
            text-decoration: none; 
          }
          a:hover { 
            color: #fff; 
            text-decoration: underline; 
          }
          .tag {
            background: #222;
            padding: 3px 8px;
            border-radius: 5px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>XML Sitemap</h1>
            <p>Generated for Nothing Space. This file is used by search engines to easily crawl the website.</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Page URL</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <xsl:variable name="itemURL">
                      <xsl:value-of select="sitemap:loc"/>
                    </xsl:variable>
                    <a href="{$itemURL}" target="_blank">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <span class="tag"><xsl:value-of select="sitemap:lastmod"/></span>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
